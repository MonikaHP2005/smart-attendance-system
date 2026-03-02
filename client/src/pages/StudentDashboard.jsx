import { useState, useEffect, useCallback } from "react";
import { Scanner } from "@yudiel/react-qr-scanner";
import toast, { Toaster } from "react-hot-toast";

function StudentDashboard() {
  const [isScanning, setIsScanning] = useState(false);
  const [cameraMode, setCameraMode] = useState("environment");
  const [scanLock, setScanLock] = useState(false);
  
  // NEW: State to control the Popup Modal
  const [popupData, setPopupData] = useState(null); // { title, message, type: 'success'|'error' }

  const [stats, setStats] = useState({ percentage: 0, attended: 0, total: 0 });
  const [history, setHistory] = useState([]);

  const studentId = localStorage.getItem("userId");

  const fetchStats = useCallback(async () => {
    if (!studentId) return;
    try {
      const response = await fetch(`http://localhost:5000/api/events/student-stats/${studentId}`);
      const data = await response.json();
      if (response.ok) {
        setStats({ percentage: data.percentage, attended: data.attended, total: data.total });
        setHistory(data.history);
      }
    } catch (error) {
      console.error("Failed to fetch stats");
    }
  }, [studentId]);

  useEffect(() => { fetchStats(); }, [fetchStats]);

  const handleScan = async (result) => {
    // If we are locked OR a popup is currently showing, ignore the camera
    if (!result || scanLock || popupData) return;

    try {
      setScanLock(true);
      
      let qrText = "";
      if (typeof result === "string") qrText = result; 
      else if (Array.isArray(result) && result[0]?.rawValue) qrText = result[0].rawValue; 
      else if (result?.text) qrText = result.text; 
      else throw new Error("Could not extract text from scan result");

      toast.loading("Verifying Location...", { id: "scan-toast" });

      const qrData = JSON.parse(qrText);
      const { eventId, token } = qrData;

      if (!eventId || !token) throw new Error("Invalid QR Format");

      if (!navigator.geolocation) {
        toast.dismiss("scan-toast");
        setPopupData({ title: "Error", message: "Geolocation not supported.", type: "error" });
        return;
      }

      navigator.geolocation.getCurrentPosition(
        async (position) => {
          const studentLat = position.coords.latitude;
          const studentLon = position.coords.longitude;

          try {
            const response = await fetch("http://localhost:5000/api/events/attend", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ eventId, qrToken: token, studentLat, studentLon, studentId }),
            });

            const data = await response.json();
            toast.dismiss("scan-toast"); // Remove the loading toast

            if (response.ok) {
              // Trigger the beautiful Check-In or Check-Out Modal
              const isCheckIn = data.action === "CHECK_IN";
              setPopupData({
                title: isCheckIn ? "Checked In!" : "Checked Out!",
                message: data.message,
                type: "success"
              });
              fetchStats(); 
            } else {
              setPopupData({ title: "Verification Failed", message: data.message, type: "error" });
            }
          } catch (err) {
            toast.dismiss("scan-toast");
            setPopupData({ title: "Connection Error", message: "Could not reach the server.", type: "error" });
          }
        },
        (error) => {
          toast.dismiss("scan-toast");
          setPopupData({ title: "GPS Required", message: "Please allow location access!", type: "error" });
        },
        { enableHighAccuracy: true } 
      );
    } catch (error) {
      toast.dismiss("scan-toast");
      setPopupData({ title: "Invalid QR", message: "This is not a valid attendance QR code.", type: "error" });
    }
  };

  // Function to run when they click "OK" on the popup
  const closePopup = () => {
    setPopupData(null);
    setScanLock(false);
    setIsScanning(false); // Close the camera view completely
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6 font-sans text-gray-800 relative">
      <Toaster position="top-center" />

      {/* POPUP MODAL (Renders on top of everything if popupData exists) */}
      {popupData && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-60 backdrop-blur-sm p-4">
          <div className="bg-white rounded-3xl p-8 max-w-sm w-full text-center shadow-2xl transform transition-all scale-100 animate-fade-in">
            {popupData.type === 'success' ? (
              <div className="mx-auto flex items-center justify-center h-20 w-20 rounded-full bg-green-100 mb-6">
                <span className="text-5xl text-green-500">✅</span>
              </div>
            ) : (
              <div className="mx-auto flex items-center justify-center h-20 w-20 rounded-full bg-red-100 mb-6">
                <span className="text-5xl text-red-500">❌</span>
              </div>
            )}
            
            <h3 className="text-2xl font-bold text-gray-900 mb-2">{popupData.title}</h3>
            <p className="text-gray-500 mb-8">{popupData.message}</p>
            
            <button 
              onClick={closePopup}
              className={`w-full py-4 rounded-xl text-white font-bold text-lg shadow-md transition transform hover:-translate-y-1 ${
                popupData.type === 'success' ? 'bg-green-600 hover:bg-green-700' : 'bg-red-600 hover:bg-red-700'
              }`}
            >
              OK
            </button>
          </div>
        </div>
      )}

      {/* HEADER SECTION */}
      <div className="max-w-3xl mx-auto bg-white shadow-sm rounded-2xl p-6 text-center border-t-4 border-green-500 mb-8">
        <h2 className="text-3xl font-extrabold text-green-700">Student Portal</h2>
        <p className="text-gray-500 mt-2">Fund a Child in India - Attendance Tracker</p>
      </div>

      <div className="max-w-3xl mx-auto">
        
        {/* BIG SCAN BUTTON */}
        {!isScanning ? (
          <div className="flex justify-center mb-10">
            <button 
              onClick={() => { setIsScanning(true); setScanLock(false); }}
              className="bg-green-600 hover:bg-green-700 text-white rounded-full px-10 py-5 shadow-xl text-xl font-bold transition transform hover:scale-105 flex items-center gap-3"
            >
              <span className="text-3xl">📷</span> 
              Scan QR to Check In / Out
            </button>
          </div>
        ) : (
          /* CAMERA VIEW */
          <div className="bg-white shadow-2xl rounded-2xl p-6 border-2 border-green-100 mb-10">
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-bold text-gray-700 text-lg">Align QR Code in frame</h3>
              <button 
                onClick={() => setIsScanning(false)} 
                className="bg-red-100 text-red-600 hover:bg-red-200 px-4 py-2 rounded-lg font-medium transition"
              >
                Cancel
              </button>
            </div>
            
            <div className="rounded-xl overflow-hidden border-4 border-gray-800 relative bg-black">
                <Scanner onScan={handleScan} constraints={{ facingMode: cameraMode }} />
            </div>
            
            <div className="mt-4 text-center">
              <button onClick={() => setCameraMode(prev => prev === "environment" ? "user" : "environment")} className="text-sm text-gray-500 underline hover:text-green-600">
                Flip Camera
              </button>
            </div>
          </div>
        )}

        {/* STATISTICS SECTION */}
        <div className="grid grid-cols-2 gap-6 mb-10">
          <div className="bg-white shadow-sm rounded-2xl p-6 flex flex-col items-center justify-center border border-gray-100">
            <h3 className="text-gray-500 font-medium mb-2">Overall Attendance</h3>
            <div className="relative flex items-center justify-center">
              <svg className="w-32 h-32 transform -rotate-90">
                <circle cx="64" cy="64" r="56" stroke="currentColor" strokeWidth="12" fill="transparent" className="text-gray-100" />
                <circle cx="64" cy="64" r="56" stroke="currentColor" strokeWidth="12" fill="transparent" strokeDasharray="351.8" strokeDashoffset={351.8 - (351.8 * stats.percentage) / 100} className="text-green-500 transition-all duration-1000 ease-out" />
              </svg>
              <span className="absolute text-3xl font-bold text-gray-800">{stats.percentage}%</span>
            </div>
          </div>

          <div className="bg-white shadow-sm rounded-2xl p-6 flex flex-col justify-center border border-gray-100">
            <h3 className="text-gray-500 font-medium mb-4">Your Activity</h3>
            <div className="space-y-4">
              <div>
                <p className="text-sm text-gray-400 uppercase tracking-wider">Total Attended</p>
                <p className="text-2xl font-bold text-green-600">{stats.attended} <span className="text-lg text-gray-400 font-normal">/ {stats.total} Events</span></p>
              </div>
              <div className="w-full bg-gray-100 rounded-full h-2">
                <div className="bg-green-500 h-2 rounded-full transition-all duration-1000" style={{ width: `${stats.percentage}%` }}></div>
              </div>
            </div>
          </div>
        </div>

        {/* RECENT HISTORY TABLE */}
        <div className="bg-white shadow-sm rounded-2xl p-6 border border-gray-100">
          <h3 className="text-xl font-bold text-gray-800 mb-6 border-b pb-4">Recent Check-ins</h3>
          {history.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-gray-50 text-gray-500 text-sm uppercase tracking-wider">
                    <th className="py-3 px-4 rounded-tl-lg font-medium">Activity Title</th>
                    <th className="py-3 px-4 font-medium">Type</th>
                    <th className="py-3 px-4 font-medium">Date & Time</th>
                    <th className="py-3 px-4 rounded-tr-lg font-medium text-center">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {history.map((item, index) => (
                    <tr key={index} className="hover:bg-gray-50 transition duration-150">
                      <td className="py-4 px-4 font-semibold text-gray-800">{item.title}</td>
                      <td className="py-4 px-4 text-sm text-gray-500">
                        <span className="bg-blue-50 text-blue-600 px-2 py-1 rounded text-xs font-bold">{item.activity_type}</span>
                      </td>
                      <td className="py-4 px-4 text-sm text-gray-600">
                        {new Date(item.check_in_time).toLocaleString()}
                      </td>
                      <td className="py-4 px-4 text-center">
                        <span className="bg-green-100 text-green-700 text-xs font-bold px-3 py-1 rounded-full border border-green-200">
                          {item.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="text-center py-10 text-gray-400">
              <p className="text-5xl mb-3">📭</p>
              <p>You haven't attended any events yet.</p>
            </div>
          )}
        </div>

      </div>
    </div>
  );
}

export default StudentDashboard;