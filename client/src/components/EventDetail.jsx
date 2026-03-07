import React, { useState, useEffect, useCallback } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import toast, { Toaster } from 'react-hot-toast';

// Import the PDF libraries
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';

const EventDetail = ({ event, onBack, onUpdate }) => {
  const [qrToken, setQrToken] = useState(event?.qr_token || null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isActive, setIsActive] = useState(event?.is_active || false);
  
  const [timeStatus, setTimeStatus] = useState('LOADING'); 
  const [timeMessage, setTimeMessage] = useState('');
  const [attendanceList, setAttendanceList] = useState([]);
  const [searchTerm, setSearchTerm] = useState(''); 

  const fetchAttendance = useCallback(async () => {
    if (!event) return;
    try {
      const token = localStorage.getItem('adminToken');
      const response = await fetch(`http://localhost:5000/api/events/${event.id}/attendance`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      if (response.ok) {
        const data = await response.json();
        const sortedData = data.sort((a, b) => a.name.localeCompare(b.name));
        setAttendanceList(sortedData);
      }
    } catch (error) {
      console.error("Failed to fetch attendance.");
    }
  }, [event]);

  useEffect(() => {
    if (event) {
      setQrToken(event.qr_token);
      setIsActive(event.is_active);
      fetchAttendance();
    }
  }, [event, fetchAttendance]);

  useEffect(() => {
    if (!event) return;

    const checkTime = () => {
      const now = new Date();
      const startTime = new Date(event.start_time);
      const endTime = new Date(event.end_time);
      const tenMinsBeforeStart = new Date(startTime.getTime() - 10 * 60 * 1000);

      if (now < tenMinsBeforeStart) {
        setTimeStatus('TOO_EARLY');
        const unlockTimeString = tenMinsBeforeStart.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        setTimeMessage(`Unlocks 10 mins before start (at ${unlockTimeString})`);
      } else if (now > endTime) {
        setTimeStatus('ENDED');
        setTimeMessage('This session has already ended.');
        if (isActive) handleCloseEvent(true);
      } else {
        setTimeStatus('READY');
        setTimeMessage('Ready to generate QR Code.');
      }
    };

    checkTime(); 
    const intervalId = setInterval(() => {
      checkTime();
      if (isActive) fetchAttendance(); 
    }, 5000); 

    return () => clearInterval(intervalId); 
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [event, isActive, fetchAttendance]); 

  // 🔥 1. EXTRACTED API CALL
  const sendGenerateRequest = async (latitude, longitude) => {
    try {
      const token = localStorage.getItem('adminToken');
      const response = await fetch(`http://localhost:5000/api/events/${event.id}/generate-qr`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ latitude, longitude }),
      });
      const data = await response.json();
      
      if (response.ok) {
        setQrToken(data.qrToken);
        setIsActive(true);
        if (onUpdate) onUpdate();
        
        // Custom success message based on class type
        if (event.activity_type === 'ONLINE_CLASS') {
          toast.success("Online Session Live! No GPS required.");
        } else {
          toast.success("QR Code Live! Geofence established.");
        }
      } else {
        toast.error(data.message || "Failed to generate QR");
      }
    } catch (error) {
      toast.error("Cannot connect to server.");
    } finally {
      setIsGenerating(false);
      toast.dismiss('generating-toast');
    }
  };

  // 🔥 2. UPDATED GENERATE LOGIC
  const handleGenerateQR = async () => {
    if (timeStatus !== 'READY') return;
    setIsGenerating(true);

    // Bypass GPS completely for Online Classes
    if (event.activity_type === 'ONLINE_CLASS') {
      toast.loading("Starting Online Session...", { id: 'generating-toast' });
      sendGenerateRequest(null, null);
      return;
    }

    // Otherwise, physical class: request GPS
    toast.loading("Acquiring GPS Lock...", { id: 'generating-toast' });
    
    if (!navigator.geolocation) {
      toast.dismiss('generating-toast');
      toast.error("Geolocation is not supported by your browser");
      setIsGenerating(false);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        sendGenerateRequest(position.coords.latitude, position.coords.longitude);
      },
      (error) => {
        toast.dismiss('generating-toast');
        toast.error("Please allow location access to set the geofence.");
        setIsGenerating(false);
      },
      { enableHighAccuracy: true }
    );
  };

  const handleCloseEvent = async (isAutoClose = false) => {
    try {
      const token = localStorage.getItem('adminToken');
      const response = await fetch(`http://localhost:5000/api/events/${event.id}/close`, { 
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (response.ok) {
        setIsActive(false);
        fetchAttendance(); 
        if (onUpdate) onUpdate(); 
        
        if (isAutoClose) toast("Time expired! Event auto-closed.", { icon: '⏰' });
        else toast.success("Event closed. Attendance finalized!");
      }
    } catch (error) {
      console.error("Failed to close event:", error);
    }
  };

  // --- EXCEL/CSV EXPORT ---
  const handleDownloadCSV = () => {
    if (attendanceList.length === 0) {
      toast.error("No attendance data to download yet.");
      return;
    }

    const headers = ["Student Name", "Roll No", "Check-In Time", "Check-Out Time"];
    const csvRows = attendanceList.map(record => {
      const checkIn = new Date(record.check_in_time).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'});
      const checkOut = record.check_out_time ? new Date(record.check_out_time).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}) : 'In Session';
      return [`"${record.name}"`, record.student_id, checkIn, checkOut].join(",");
    });

    const csvContent = [headers.join(","), ...csvRows].join("\n");
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    
    const cleanFileName = `${event.title.replace(/\s+/g, '_')}_${event.batch}_Attendance.csv`;
    link.setAttribute("download", cleanFileName);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success("Excel report downloaded!");
  };

  // --- PDF EXPORT ---
  const handleDownloadPDF = () => {
    if (attendanceList.length === 0) {
      toast.error("No attendance data to download yet.");
      return;
    }

    try {
      const doc = new jsPDF();

      doc.setFontSize(20);
      doc.setTextColor(15, 23, 42); 
      doc.text("Attendance Report", 14, 22);

      doc.setFontSize(11);
      doc.setTextColor(100, 116, 139); 
      doc.text(`Subject: ${event.title}`, 14, 32);
      doc.text(`Batch: ${event.batch}`, 14, 38);
      doc.text(`Date: ${new Date(event.start_time).toLocaleDateString()}`, 14, 44);
      doc.text(`Total Present: ${attendanceList.length}`, 14, 50);

      const tableColumn = ["Student Name", "Roll No", "Check-In", "Check-Out"];
      const tableRows = [];

      attendanceList.forEach(record => {
        const checkIn = new Date(record.check_in_time).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'});
        const checkOut = record.check_out_time ? new Date(record.check_out_time).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}) : 'In Session';
        tableRows.push([record.name, record.student_id, checkIn, checkOut]);
      });

      autoTable(doc, {
        head: [tableColumn],
        body: tableRows,
        startY: 56, 
        theme: 'grid',
        headStyles: { fillColor: [37, 99, 235] }, 
      });

      const cleanFileName = `${event.title.replace(/\s+/g, '_')}_${event.batch}_Attendance.pdf`;
      doc.save(cleanFileName);
      toast.success("PDF report downloaded!");
      
    } catch (error) {
      console.error("PDF Generation Error:", error);
      toast.error("Failed to generate PDF. Check console.");
    }
  };

  if (!event) return null;

  const qrDataString = JSON.stringify({ eventId: event.id, qrToken: qrToken });
  const isEventFinished = timeStatus === 'ENDED' || (!isActive && event.qr_token);

  const filteredAttendance = attendanceList.filter((student) => {
    const searchLower = searchTerm.toLowerCase();
    return (
      student.name.toLowerCase().includes(searchLower) ||
      student.student_id.toLowerCase().includes(searchLower)
    );
  });

  return (
    <div className="animate-fade-in max-w-6xl mx-auto">
      <Toaster position="top-center" />
      
      <div className="flex items-center justify-between mb-8">
        <div>
          <button onClick={onBack} className="bg-slate-100 hover:bg-blue-50 text-slate-600 hover:text-blue-700 px-4 py-2.5 rounded-xl font-bold text-xs uppercase tracking-wider transition-all flex items-center gap-2 mb-4 shadow-sm active:scale-95 w-fit border border-slate-200">
           Back
          </button>
          <h1 className="text-4xl font-black text-slate-900 tracking-tight">{event.title}</h1>
          <p className="text-slate-500 font-medium mt-1 tracking-wide">Batch: {event.batch} | Instructor: {event.instructor_name || 'N/A'}</p>
          <p className="text-sm font-bold text-slate-400 mt-2">
            Schedule: {new Date(event.start_time).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})} - {new Date(event.end_time).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
          </p>
        </div>
        <div className={`px-4 py-2 rounded-full font-bold text-sm tracking-widest uppercase ${isActive ? 'bg-green-100 text-green-700 animate-pulse' : 'bg-slate-100 text-slate-500'}`}>
          {isActive ? 'Live / Accepting Scans' : 'Inactive'}
        </div>
      </div>

      <div className={`grid gap-8 ${!isEventFinished && qrToken ? 'lg:grid-cols-12' : 'grid-cols-1'}`}>
        {!isEventFinished && (
          <div className={`bg-white p-10 rounded-[2.5rem] shadow-[0_4px_20px_rgba(0,0,0,0.03)] border border-slate-100 flex flex-col items-center justify-center text-center ${qrToken ? 'lg:col-span-4' : 'w-full max-w-2xl mx-auto min-h-[400px]'}`}>
            {!qrToken ? (
              <div className="max-w-md">
                <div className={`w-24 h-24 rounded-full flex items-center justify-center text-4xl mx-auto mb-6 transition-colors ${timeStatus === 'READY' ? 'bg-blue-50 text-blue-500' : 'bg-slate-50 text-slate-400'}`}>
                  {timeStatus === 'TOO_EARLY' ? '⏳' : '📍'}
                </div>
                <h2 className="text-2xl font-bold text-slate-800 mb-3">{timeStatus === 'TOO_EARLY' ? 'Not yet time' : 'Ready to start?'}</h2>
                <p className="text-slate-500 mb-8 font-medium">{timeMessage}</p>
                <button onClick={handleGenerateQR} disabled={isGenerating || timeStatus !== 'READY'} className={`w-full font-bold text-lg py-4 rounded-xl transition-all ${timeStatus === 'TOO_EARLY' ? 'bg-slate-200 text-slate-500 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700 text-white shadow-lg'}`}>
                  {isGenerating ? "Processing..." : timeStatus === 'TOO_EARLY' ? "Button Locked" : "Generate Live QR"}
                </button>
              </div>
            ) : (
              <div className="flex flex-col items-center w-full">
                <div className="bg-white p-4 rounded-3xl shadow-lg border-4 border-blue-50 mb-6">
                  <QRCodeSVG value={qrDataString} size={220} level="H" includeMargin={true} />
                </div>
                <p className="text-slate-500 mb-6 text-sm">
                  {event.activity_type === 'ONLINE_CLASS' ? 'Scan to check in virtually.' : 'Students must be within 50 meters.'}
                </p>
                <button onClick={() => handleCloseEvent(false)} className="w-full bg-red-50 hover:bg-red-100 text-red-600 font-bold py-3 rounded-xl transition-all">Close Event Early</button>
              </div>
            )}
          </div>
        )}

        <div className={`bg-white p-8 rounded-[2.5rem] shadow-[0_4px_20px_rgba(0,0,0,0.03)] border border-slate-100 flex flex-col ${!isEventFinished && qrToken ? 'lg:col-span-8' : 'w-full'}`}>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 border-b border-slate-100 pb-6">
            <h3 className="text-2xl font-bold text-slate-800 tracking-tight">Attendance Roster</h3>
            
            <div className="flex items-center gap-3">
              <span className="bg-blue-50 text-blue-600 font-bold px-4 py-2 rounded-xl text-sm border border-blue-100 hidden sm:block">
                Total Present: {attendanceList.length}
              </span>
              
              {attendanceList.length > 0 && (
                <>
                  <button onClick={handleDownloadCSV} className="bg-green-600 hover:bg-green-700 text-white font-bold px-4 py-2 rounded-xl text-sm transition-all shadow-md active:scale-95 flex items-center gap-2">
                    <span className="text-lg leading-none">📊</span> Excel
                  </button>
                  <button onClick={handleDownloadPDF} className="bg-red-600 hover:bg-red-700 text-white font-bold px-4 py-2 rounded-xl text-sm transition-all shadow-md active:scale-95 flex items-center gap-2">
                    <span className="text-lg leading-none">📄</span> PDF
                  </button>
                </>
              )}
            </div>
          </div>

          {attendanceList.length > 0 && (
            <div className="mb-6">
              <div className="relative max-w-md">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 text-lg">🔍</span>
                <input 
                  type="text" 
                  placeholder="Search by Name or Roll No..." 
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 text-slate-800 text-sm rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 block pl-12 p-3 font-medium transition-all"
                />
              </div>
            </div>
          )}

          {attendanceList.length === 0 ? (
            <div className="text-center py-16 text-slate-400 my-auto">
              <div className="text-5xl mb-4">📝</div>
              <p className="font-medium">No one has checked in yet.</p>
            </div>
          ) : filteredAttendance.length === 0 ? (
            <div className="text-center py-16 text-slate-400 my-auto">
              <div className="text-4xl mb-4">🕵️‍♂️</div>
              <p className="font-medium">No students found matching "{searchTerm}"</p>
            </div>
          ) : (
            <div className="overflow-y-auto flex-1 pr-2 custom-scrollbar" style={{ maxHeight: '400px' }}>
              <table className="w-full text-left border-collapse">
                <thead className="sticky top-0 bg-white shadow-[0_4px_10px_-4px_rgba(0,0,0,0.05)] z-10">
                  <tr className="text-xs font-bold text-slate-400 uppercase tracking-wider border-b border-slate-100">
                    <th className="py-4 px-4">Student Name</th>
                    <th className="py-4 px-4">Roll No</th>
                    <th className="py-4 px-4">Check-In</th>
                    <th className="py-4 px-4">Check-Out</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {filteredAttendance.map((record) => (
                    <tr key={record.id} className="hover:bg-slate-50 transition-colors">
                      <td className="py-4 px-4 font-bold text-slate-800">{record.name}</td>
                      <td className="py-4 px-4 text-slate-500 font-medium">{record.student_id}</td>
                      <td className="py-4 px-4 text-slate-600 text-sm">
                        {new Date(record.check_in_time).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                      </td>
                      <td className="py-4 px-4 text-slate-600 text-sm">
                        {record.check_out_time ? (
                          <span className="text-slate-600">{new Date(record.check_out_time).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
                        ) : (
                          <span className="bg-green-100 text-green-700 text-xs font-bold px-2 py-1 rounded-md animate-pulse">In Session</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default EventDetail;