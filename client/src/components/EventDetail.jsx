import React, { useState, useEffect, useCallback } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import toast, { Toaster } from 'react-hot-toast';

const EventDetail = ({ event, onBack, onUpdate }) => {
  const [qrToken, setQrToken] = useState(event?.qr_token || null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isActive, setIsActive] = useState(event?.is_active || false);
  
  const [timeStatus, setTimeStatus] = useState('LOADING'); 
  const [timeMessage, setTimeMessage] = useState('');
  const [attendanceList, setAttendanceList] = useState([]);

  const fetchAttendance = useCallback(async () => {
    if (!event) return;
    try {
      const token = localStorage.getItem('adminToken'); // 🔥 Use adminToken
      const response = await fetch(`http://localhost:5000/api/events/${event.id}/attendance`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (response.ok) {
        const data = await response.json();
        setAttendanceList(data);
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

  const handleGenerateQR = async () => {
    if (timeStatus !== 'READY') return;
    setIsGenerating(true);

    if (!navigator.geolocation) {
      toast.error("Geolocation is not supported by your browser");
      setIsGenerating(false);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;
        try {
          const token = localStorage.getItem('adminToken'); // 🔥 Use adminToken
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
            toast.success("QR Code Live! Geofence established.");
          } else {
            toast.error(data.message || "Failed to generate QR");
          }
        } catch (error) {
          toast.error("Cannot connect to server.");
        } finally {
          setIsGenerating(false);
        }
      },
      (error) => {
        toast.error("Please allow location access to set the geofence.");
        setIsGenerating(false);
      },
      { enableHighAccuracy: true }
    );
  };

  const handleCloseEvent = async (isAutoClose = false) => {
    try {
      const token = localStorage.getItem('adminToken'); // 🔥 Use adminToken
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

  if (!event) return null;

  const qrDataString = JSON.stringify({ eventId: event.id, qrToken: qrToken });
  const isEventFinished = timeStatus === 'ENDED' || (!isActive && event.qr_token);

  return (
    <div className="animate-fade-in max-w-6xl mx-auto">
      <Toaster position="top-center" />
      
      <div className="flex items-center justify-between mb-8">
        <div>
          <button onClick={onBack} className="bg-slate-100 hover:bg-blue-50 text-slate-600 hover:text-blue-700 px-4 py-2.5 rounded-xl font-bold text-xs uppercase tracking-wider transition-all flex items-center gap-2 mb-4 shadow-sm active:scale-95 w-fit border border-slate-200">
            <span className="text-base leading-none">←</span> Back
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
                  {isGenerating ? "Acquiring GPS Lock..." : timeStatus === 'TOO_EARLY' ? "Button Locked" : "Generate Live QR"}
                </button>
              </div>
            ) : (
              <div className="flex flex-col items-center w-full">
                <div className="bg-white p-4 rounded-3xl shadow-lg border-4 border-blue-50 mb-6">
                  <QRCodeSVG value={qrDataString} size={220} level="H" includeMargin={true} />
                </div>
                <p className="text-slate-500 mb-6 text-sm">Students must be within 50 meters.</p>
                <button onClick={() => handleCloseEvent(false)} className="w-full bg-red-50 hover:bg-red-100 text-red-600 font-bold py-3 rounded-xl transition-all">Close Event Early</button>
              </div>
            )}
          </div>
        )}

        <div className={`bg-white p-8 rounded-[2.5rem] shadow-[0_4px_20px_rgba(0,0,0,0.03)] border border-slate-100 ${!isEventFinished && qrToken ? 'lg:col-span-8' : 'w-full'}`}>
          <div className="flex items-center justify-between mb-6 border-b border-slate-100 pb-4">
            <h3 className="text-2xl font-bold text-slate-800 tracking-tight">Attendance Roster</h3>
            <span className="bg-blue-50 text-blue-600 font-bold px-4 py-1.5 rounded-full text-sm">Total Present: {attendanceList.length}</span>
          </div>
          {attendanceList.length === 0 ? (
            <div className="text-center py-16 text-slate-400">
              <div className="text-5xl mb-4">📝</div>
              <p className="font-medium">No one has checked in yet.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="text-xs font-bold text-slate-400 uppercase tracking-wider border-b border-slate-100">
                    <th className="py-4 px-4">Student Name</th>
                    <th className="py-4 px-4">Roll No</th>
                    <th className="py-4 px-4">Check-In</th>
                    <th className="py-4 px-4">Check-Out</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {attendanceList.map((record) => (
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