import { useState } from "react";
import { Scanner } from "@yudiel/react-qr-scanner";

function StudentDashboard() {
  const [scanData, setScanData] = useState(null);
  const [distance, setDistance] = useState(null);
  const [allowed, setAllowed] = useState(false);
  const [history, setHistory] = useState([]);
  const [cameraMode, setCameraMode] = useState("environment");
  const [scanLock, setScanLock] = useState(false);

  const handleScan = (result) => {
    if (!result || scanLock) return;

    try {
      const qrData = JSON.parse(result[0].rawValue);
      const eventLat = qrData.lat;
      const eventLon = qrData.lon;

      setScanLock(true); // prevent duplicate scans
      getStudentLocation(eventLat, eventLon, qrData.eventId);

    } catch (error) {
      alert("Invalid QR Code");
    }
  };

  const getStudentLocation = (eventLat, eventLon, eventId) => {
    if (!navigator.geolocation) {
      alert("Geolocation not supported");
      return;
    }

    navigator.geolocation.getCurrentPosition((position) => {
      const studentLat = position.coords.latitude;
      const studentLon = position.coords.longitude;

      const dist = calculateDistance(
        studentLat,
        studentLon,
        eventLat,
        eventLon
      );

      setDistance(dist);

      if (dist <= 150) {
        setAllowed(true);

        const newEntry = {
          id: Date.now(),
          event: `Event ID ${eventId}`,
          date: new Date().toLocaleDateString(),
          time: new Date().toLocaleTimeString(),
          status: "Present",
        };

        setHistory((prev) => [newEntry, ...prev]);

      } else {
        setAllowed(false);
      }

      setScanData(true);
    });
  };

  const calculateDistance = (lat1, lon1, lat2, lon2) => {
    const R = 6371000;
    const toRad = (val) => (val * Math.PI) / 180;

    const dLat = toRad(lat2 - lat1);
    const dLon = toRad(lon2 - lon1);

    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(toRad(lat1)) *
        Math.cos(toRad(lat2)) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);

    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

    return Math.round(R * c);
  };

  const toggleCamera = () => {
    setCameraMode((prev) =>
      prev === "environment" ? "user" : "environment"
    );
  };

  const resetScan = () => {
    setScanData(null);
    setDistance(null);
    setAllowed(false);
    setScanLock(false);
  };

  return (
    <div className="space-y-8 p-6">

      {/* HEADER */}
      <div className="bg-white shadow-md rounded-xl p-6 text-center">
        <h2 className="text-2xl font-bold text-blue-700">
          Student Portal
        </h2>
        <p className="text-gray-500 mt-1">
          Geo-Secured QR Attendance
        </p>
      </div>

      {/* QR SCANNER */}
      <div className="bg-white shadow-md rounded-xl p-6">
        <div className="flex justify-between mb-4">
          <button
            onClick={toggleCamera}
            className="bg-indigo-600 text-white px-4 py-2 rounded-lg text-sm"
          >
            🔄 Switch Camera
          </button>

          {scanData && (
            <button
              onClick={resetScan}
              className="bg-gray-600 text-white px-4 py-2 rounded-lg text-sm"
            >
              🔁 Scan Again
            </button>
          )}
        </div>

        {!scanLock && (
          <Scanner
            onScan={handleScan}
            constraints={{ facingMode: cameraMode }}
          />
        )}
      </div>

      {/* RESULT CARD */}
      {scanData && (
        <div className="bg-white shadow-md rounded-xl p-6 text-center">
          <h3 className="text-lg font-semibold text-blue-700 mb-3">
            Verification Result
          </h3>

          {distance !== null && (
            <p className="text-gray-600">
              Distance: {distance} meters
            </p>
          )}

          {allowed ? (
            <div className="mt-3 bg-green-50 p-4 rounded-lg">
              <p className="text-green-700 font-bold">
                ✅ Attendance Marked Successfully
              </p>
              <p className="text-sm text-gray-600 mt-1">
                Time: {new Date().toLocaleTimeString()}
              </p>
            </div>
          ) : (
            <div className="mt-3 bg-red-50 p-4 rounded-lg">
              <p className="text-red-600 font-bold">
                ❌ You are outside 150m range
              </p>
            </div>
          )}
        </div>
      )}

      {/* ATTENDANCE HISTORY */}
      {history.length > 0 && (
        <div className="bg-white shadow-md rounded-xl p-6">
          <h3 className="text-lg font-semibold text-blue-700 mb-4">
            Attendance History
          </h3>

          <table className="w-full border-collapse">
            <thead>
              <tr className="bg-blue-600 text-white">
                <th className="py-2 px-3 text-left">Event</th>
                <th className="py-2 px-3 text-left">Date</th>
                <th className="py-2 px-3 text-left">Time</th>
                <th className="py-2 px-3 text-left">Status</th>
              </tr>
            </thead>
            <tbody>
              {history.map((item) => (
                <tr key={item.id} className="border-b">
                  <td className="py-2 px-3">{item.event}</td>
                  <td className="py-2 px-3">{item.date}</td>
                  <td className="py-2 px-3">{item.time}</td>
                  <td className="py-2 px-3">
                    <span className="bg-green-100 text-green-700 text-xs px-2 py-1 rounded-full">
                      {item.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

    </div>
  );
}

export default StudentDashboard;