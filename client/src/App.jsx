import { useState } from "react";
import AdminDashboard from "./pages/AdminDashboard";
import StudentDashboard from "./pages/StudentDashboard";
import fciLogo from "./assets/fci-logo.jpeg"; // ✅ correct extension

function App() {
  const [role, setRole] = useState(null);

  return (
    <div className="min-h-screen bg-gradient-to-r from-blue-100 to-blue-200 flex items-center justify-center p-6">

      {/* ROLE SELECTION */}
      {!role && (
        <div className="bg-white shadow-xl rounded-2xl p-10 text-center w-full max-w-md">

          {/* ✅ FCI LOGO ADDED HERE */}
          <img
            src={fciLogo}
            alt="FCI Logo"
            className="w-24 h-24 mx-auto mb-4 object-contain"
          />

          <h1 className="text-3xl font-bold text-blue-700 mb-4">
            Smart Attendance
          </h1>
          <p className="text-gray-500 mb-8">
            FCI – Fund a Child in India
          </p>

          <div className="flex gap-6 justify-center">
            <button
              onClick={() => setRole("admin")}
              className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg"
            >
              Admin Panel
            </button>

            <button
              onClick={() => setRole("student")}
              className="bg-green-600 hover:bg-green-700 text-white px-6 py-3 rounded-lg"
            >
              Student Portal
            </button>
          </div>
        </div>
      )}

      {/* ADMIN DASHBOARD */}
      {role === "admin" && (
        <div className="w-full max-w-5xl">
          <button
            className="mb-4 text-blue-600"
            onClick={() => setRole(null)}
          >
            ← Back
          </button>
          <AdminDashboard />
        </div>
      )}

      {/* STUDENT DASHBOARD */}
      {role === "student" && (
        <div className="w-full max-w-5xl">
          <button
            className="mb-4 text-blue-600"
            onClick={() => setRole(null)}
          >
            ← Back
          </button>
          <StudentDashboard />
        </div>
      )}
    </div>
  );
}

export default App;