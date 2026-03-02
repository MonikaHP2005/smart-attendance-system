import { useState, useEffect } from "react";
import { QRCodeCanvas } from "qrcode.react";
import toast, { Toaster } from "react-hot-toast";

function AdminDashboard() {
  const [activeTab, setActiveTab] = useState("dashboard");
  const [events, setEvents] = useState([]); // Now starts completely empty!
  const [qrToken, setQrToken] = useState("");
  const [activeEventName, setActiveEventName] = useState("");
  const [attendanceCount, setAttendanceCount] = useState(0);
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(true);

  // ==========================================
  // 1. FETCH REAL DATA FROM MYSQL ON LOAD
  // ==========================================
  useEffect(() => {
    const fetchEvents = async () => {
      try {
        const response = await fetch("http://localhost:5000/api/events");
        const data = await response.json();
        
        if (response.ok) {
          setEvents(data);
        } else {
          toast.error("Failed to load NGO activities.");
        }
      } catch (error) {
        toast.error("Cannot connect to server.");
      } finally {
        setLoading(false);
      }
    };

    fetchEvents();
  }, []); // The empty array means this runs exactly once when the page loads

  // ==========================================
  // 2. GENERATE GEOFENCED QR CODE
  // ==========================================
  const handleGenerateQR = async (event) => {
    // Check if the browser supports GPS tracking
    if (!navigator.geolocation) {
      toast.error("Geolocation is not supported by your browser!");
      return;
    }

    toast.loading("Locking GPS Coordinates...", { id: "gps-toast" });

    // Get the Admin's physical location
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;

        try {
          // Send the GPS data to your Node.js backend
          const response = await fetch(`http://localhost:5000/api/events/${event.id}/generate-qr`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ latitude, longitude }),
          });

          const data = await response.json();

          if (response.ok) {
            toast.success("Geofence Locked! QR Live.", { id: "gps-toast" });
            
            // We package the Event ID and the Secure Token together so the student's phone knows what it is scanning!
            const qrPayload = JSON.stringify({
              eventId: event.id,
              token: data.qrToken
            });

            setQrToken(qrPayload);
            setActiveEventName(event.title);
            setAttendanceCount(0); // Reset live counter
          } else {
            toast.error(data.message || "Failed to generate QR.", { id: "gps-toast" });
          }
        } catch (error) {
          toast.error("Server error while generating QR.", { id: "gps-toast" });
        }
      },
      (error) => {
        toast.error("Please allow location access to generate the QR!", { id: "gps-toast" });
      }
    );
  };

  const filteredEvents = events.filter((event) =>
    event.title.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="flex min-h-screen bg-blue-50">
      <Toaster position="top-right" /> {/* Allows the toast notifications to show */}

      {/* Sidebar (Kept exactly as your teammate designed it) */}
      <div className="w-64 bg-white shadow-lg p-6">
        <h2 className="text-xl font-bold text-blue-700 mb-6">FCI Admin</h2>
        <nav className="space-y-4">
          <button onClick={() => setActiveTab("dashboard")} className={`w-full text-left p-2 rounded-lg ${activeTab === "dashboard" ? "bg-blue-100 text-blue-700" : "hover:bg-gray-100"}`}>
            📊 Dashboard
          </button>
          <button onClick={() => setActiveTab("events")} className={`w-full text-left p-2 rounded-lg ${activeTab === "events" ? "bg-blue-100 text-blue-700" : "hover:bg-gray-100"}`}>
            📅 Activities
          </button>
        </nav>
      </div>

      {/* Main Content */}
      <div className="flex-1 p-10">
        
        {loading ? (
          <div className="text-center text-xl text-gray-500 mt-20">Loading NGO Data from Database...</div>
        ) : (
          <>
            {/* DASHBOARD TAB */}
            {activeTab === "dashboard" && (
              <>
                <h1 className="text-2xl font-bold text-blue-700 mb-8">Admin Dashboard</h1>

                {/* Database-Driven Cards */}
                <div className="grid grid-cols-3 gap-6 mb-10">
                  <div className="bg-white shadow-md rounded-xl p-6 text-center">
                    <h3 className="text-gray-500">Total Scheduled</h3>
                    <p className="text-3xl font-bold text-blue-700">{events.length}</p>
                  </div>
                  <div className="bg-white shadow-md rounded-xl p-6 text-center">
                    <h3 className="text-gray-500">Classes</h3>
                    <p className="text-3xl font-bold text-green-600">
                      {events.filter(e => e.activity_type === 'CLASS').length}
                    </p>
                  </div>
                  <div className="bg-white shadow-md rounded-xl p-6 text-center">
                    <h3 className="text-gray-500">Events & Outbound</h3>
                    <p className="text-3xl font-bold text-indigo-600">
                      {events.filter(e => e.activity_type !== 'CLASS').length}
                    </p>
                  </div>
                </div>

                {/* Dynamic Event List */}
                {events.slice(0, 3).map((event) => (
                  <div key={event.id} className="bg-white shadow-md rounded-xl p-6 mb-4 flex justify-between items-center">
                    <div>
                      <h3 className="font-semibold text-lg">{event.title}</h3>
                      <p className="text-gray-500 text-sm">
                        {new Date(event.start_time).toLocaleString()} | {event.instructor_name}
                      </p>
                      <span className="mt-2 inline-block px-3 py-1 text-sm rounded-full bg-blue-100 text-blue-700 font-medium">
                        {event.activity_type}
                      </span>
                    </div>

                    <button
                      onClick={() => handleGenerateQR(event)}
                      className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg transition"
                    >
                      Generate QR
                    </button>
                  </div>
                ))}

                {/* The Live QR Code Display */}
                {qrToken && (
                  <div className="bg-white shadow-2xl rounded-xl p-8 mt-8 text-center border-2 border-blue-500">
                    <h3 className="text-2xl font-bold text-blue-700 mb-2">
                      Live Attendance: {activeEventName}
                    </h3>
                    <p className="text-gray-500 mb-6">Scan with the Student Portal to check in.</p>
                    
                    <div className="flex justify-center bg-white p-4 rounded-lg inline-block">
                      <QRCodeCanvas value={qrToken} size={250} level={"H"} />
                    </div>
                    
                    <p className="mt-6 text-green-600 font-bold text-xl">
                      Students Checked In: {attendanceCount}
                    </p>
                  </div>
                )}
              </>
            )}

            {/* EVENTS TAB (Updated to show real database fields) */}
            {activeTab === "events" && (
              <>
                <h1 className="text-2xl font-bold text-blue-700 mb-6">NGO Activity Management</h1>
                <input
                  type="text"
                  placeholder="Search activities..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full max-w-md p-3 border rounded-lg shadow-sm mb-6 focus:ring-2 focus:ring-blue-500"
                />

                <div className="bg-white shadow-md rounded-xl overflow-hidden">
                  <table className="w-full">
                    <thead className="bg-blue-600 text-white">
                      <tr>
                        <th className="p-3 text-left">Activity Title</th>
                        <th className="p-3 text-left">Type</th>
                        <th className="p-3 text-left">Instructor</th>
                        <th className="p-3 text-left">Date & Time</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredEvents.map((event) => (
                        <tr key={event.id} className="border-b hover:bg-gray-50 transition">
                          <td className="p-3 font-medium">{event.title}</td>
                          <td className="p-3 text-sm text-gray-600">{event.activity_type}</td>
                          <td className="p-3">{event.instructor_name}</td>
                          <td className="p-3 text-sm">{new Date(event.start_time).toLocaleDateString()}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </>
            )}
          </>
        )}
      </div>
    </div>
  );
}

export default AdminDashboard;