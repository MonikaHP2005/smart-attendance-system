import { useState } from "react";
import { QRCodeCanvas } from "qrcode.react";
import toast from "react-hot-toast";

function AdminDashboard() {
  const [activeTab, setActiveTab] = useState("dashboard");
  const [qrToken, setQrToken] = useState("");
  const [attendanceCount, setAttendanceCount] = useState(0);
  const [searchTerm, setSearchTerm] = useState("");

  const events = [
    { id: 1, name: "FCI Education Workshop", date: "2026-02-25", status: "Upcoming" },
    { id: 2, name: "FCI Health Camp", date: "2026-03-10", status: "Active" },
    { id: 3, name: "FCI Awareness Program", date: "2025-01-10", status: "Closed" },
  ];

  const generateQR = (event) => {
    const token = JSON.stringify({
      eventId: event.id,
      name: event.name,
      lat: 13.005212,
      lon: 77.546086,
      time: Date.now(),
    });

    setQrToken(token);
    setAttendanceCount((prev) => prev + 1);
    toast.success("QR Generated Successfully!");
  };

  const getStatusStyle = (status) => {
    if (status === "Active") return "bg-green-100 text-green-700";
    if (status === "Upcoming") return "bg-yellow-100 text-yellow-700";
    return "bg-red-100 text-red-700";
  };

  const filteredEvents = events.filter((event) =>
    event.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="flex min-h-screen bg-blue-50">

      {/* Sidebar */}
      <div className="w-64 bg-white shadow-lg p-6">
        <h2 className="text-xl font-bold text-blue-700 mb-6">
          FCI Admin
        </h2>

        <nav className="space-y-4">
          <button onClick={() => setActiveTab("dashboard")} className={`w-full text-left p-2 rounded-lg ${activeTab === "dashboard" ? "bg-blue-100 text-blue-700" : "hover:bg-gray-100"}`}>
            📊 Dashboard
          </button>

          <button onClick={() => setActiveTab("events")} className={`w-full text-left p-2 rounded-lg ${activeTab === "events" ? "bg-blue-100 text-blue-700" : "hover:bg-gray-100"}`}>
            📅 Events
          </button>

          <button onClick={() => setActiveTab("analytics")} className={`w-full text-left p-2 rounded-lg ${activeTab === "analytics" ? "bg-blue-100 text-blue-700" : "hover:bg-gray-100"}`}>
            📈 Analytics
          </button>

          <button onClick={() => setActiveTab("settings")} className={`w-full text-left p-2 rounded-lg ${activeTab === "settings" ? "bg-blue-100 text-blue-700" : "hover:bg-gray-100"}`}>
            ⚙ Settings
          </button>
        </nav>
      </div>

      {/* Main Content */}
      <div className="flex-1 p-10">

        {/* DASHBOARD */}
        {activeTab === "dashboard" && (
          <>
            <h1 className="text-2xl font-bold text-blue-700 mb-8">
              Admin Dashboard
            </h1>

            <div className="grid grid-cols-3 gap-6 mb-10">
              <div className="bg-white shadow-md rounded-xl p-6 text-center">
                <h3 className="text-gray-500">Total Events</h3>
                <p className="text-3xl font-bold text-blue-700">{events.length}</p>
              </div>

              <div className="bg-white shadow-md rounded-xl p-6 text-center">
                <h3 className="text-gray-500">Active Events</h3>
                <p className="text-3xl font-bold text-green-600">
                  {events.filter(e => e.status === "Active").length}
                </p>
              </div>

              <div className="bg-white shadow-md rounded-xl p-6 text-center">
                <h3 className="text-gray-500">Total Attendance</h3>
                <p className="text-3xl font-bold text-indigo-600">{attendanceCount}</p>
              </div>
            </div>

            {events.map((event) => (
              <div key={event.id} className="bg-white shadow-md rounded-xl p-6 mb-4 flex justify-between items-center">
                <div>
                  <h3 className="font-semibold text-lg">{event.name}</h3>
                  <p className="text-gray-500 text-sm">{event.date}</p>
                  <span className={`mt-2 inline-block px-3 py-1 text-sm rounded-full ${getStatusStyle(event.status)}`}>
                    {event.status}
                  </span>
                </div>

                <button
                  onClick={() => generateQR(event)}
                  className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg"
                >
                  Generate QR
                </button>
              </div>
            ))}

            {qrToken && (
              <div className="bg-white shadow-lg rounded-xl p-6 mt-8 text-center">
                <h3 className="text-lg font-semibold text-blue-700 mb-4">
                  Live QR Code
                </h3>
                <div className="flex justify-center">
                  <QRCodeCanvas value={qrToken} size={200} />
                </div>
                <p className="mt-4 text-blue-600 font-semibold">
                  Live Attendance Count: {attendanceCount}
                </p>
              </div>
            )}
          </>
        )}

        {/* EVENTS TAB */}
        {activeTab === "events" && (
          <>
            <h1 className="text-2xl font-bold text-blue-700 mb-6">
              Event Management
            </h1>

            <input
              type="text"
              placeholder="Search events..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full max-w-md p-3 border rounded-lg shadow-sm mb-6"
            />

            <div className="bg-white shadow-md rounded-xl overflow-hidden">
              <table className="w-full">
                <thead className="bg-blue-600 text-white">
                  <tr>
                    <th className="p-3 text-left">Event</th>
                    <th className="p-3 text-left">Date</th>
                    <th className="p-3 text-left">Status</th>
                    <th className="p-3 text-left">Registrations</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredEvents.map((event) => (
                    <tr key={event.id} className="border-b">
                      <td className="p-3">{event.name}</td>
                      <td className="p-3">{event.date}</td>
                      <td className="p-3">
                        <span className={`px-3 py-1 text-sm rounded-full ${getStatusStyle(event.status)}`}>
                          {event.status}
                        </span>
                      </td>
                      <td className="p-3">{Math.floor(Math.random() * 150)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}

        {/* ANALYTICS TAB */}
        {activeTab === "analytics" && (
          <>
            <h1 className="text-2xl font-bold text-blue-700 mb-6">
              Attendance Analytics
            </h1>

            <div className="grid grid-cols-3 gap-6 mb-10">
              <div className="bg-white shadow-md rounded-xl p-6 text-center">
                <h3 className="text-gray-500">Total Attendance</h3>
                <p className="text-3xl font-bold text-blue-700">{attendanceCount}</p>
              </div>

              <div className="bg-white shadow-md rounded-xl p-6 text-center">
                <h3 className="text-gray-500">Average Attendance</h3>
                <p className="text-3xl font-bold text-green-600">
                  {Math.floor(attendanceCount / events.length)}
                </p>
              </div>

              <div className="bg-white shadow-md rounded-xl p-6 text-center">
                <h3 className="text-gray-500">Growth Rate</h3>
                <p className="text-3xl font-bold text-indigo-600">
                  +{Math.floor(Math.random() * 30)}%
                </p>
              </div>
            </div>
          </>
        )}

        {/* SETTINGS TAB (FULL PROFESSIONAL CONTENT ADDED) */}
        {activeTab === "settings" && (
          <div className="space-y-8">
            <h1 className="text-2xl font-bold text-blue-700">
              System Settings
            </h1>

            {/* Organization */}
            <div className="bg-white shadow-md rounded-xl p-6 space-y-4">
              <h3 className="text-lg font-semibold">🏢 Organization Settings</h3>
              <input type="text" placeholder="Organization Name" className="w-full border p-2 rounded" />
              <input type="email" placeholder="Admin Email" className="w-full border p-2 rounded" />
              <input type="text" placeholder="Contact Number" className="w-full border p-2 rounded" />
            </div>

            {/* Location */}
            <div className="bg-white shadow-md rounded-xl p-6 space-y-4">
              <h3 className="text-lg font-semibold">📍 Location Settings</h3>
              <input type="number" placeholder="Default Latitude" className="w-full border p-2 rounded" />
              <input type="number" placeholder="Default Longitude" className="w-full border p-2 rounded" />
              <input type="number" placeholder="Allowed Radius (meters)" className="w-full border p-2 rounded" />
            </div>

            {/* QR Settings */}
            <div className="bg-white shadow-md rounded-xl p-6 space-y-4">
              <h3 className="text-lg font-semibold">⚙ QR Configuration</h3>
              <input type="number" placeholder="QR Refresh Interval (seconds)" className="w-full border p-2 rounded" />
              <input type="number" placeholder="QR Expiry Time (minutes)" className="w-full border p-2 rounded" />
            </div>

            <button className="bg-blue-700 text-white px-6 py-3 rounded-lg">
              Save Settings
            </button>
          </div>
        )}

      </div>
    </div>
  );
}

export default AdminDashboard;