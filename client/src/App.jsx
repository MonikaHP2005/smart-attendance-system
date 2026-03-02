import { BrowserRouter as Router, Routes, Route, useNavigate } from "react-router-dom";

// Importing the Pages
import AdminDashboard from "./pages/AdminDashboard";
import StudentDashboard from "./pages/StudentDashboard";
import AdminLogin from "./pages/AdminLogin";
import StudentLogin from "./pages/StudentLogin";
import StudentRegister from "./pages/StudentRegister";

// Importing the Logo
import fciLogo from "./assets/fci-logo.jpeg";

// ----------------------------------------------------
// 1. The Landing Page Component (Your teammate's UI)
// ----------------------------------------------------
const LandingPage = () => {
  const navigate = useNavigate(); // This replaces setRole to actually change the URL

  return (
    <div className="bg-white shadow-xl rounded-2xl p-10 text-center w-full max-w-md">
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
          onClick={() => navigate("/admin-login")}
          className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-semibold transition"
        >
          Admin Panel
        </button>

        <button
          onClick={() => navigate("/student-login")}
          className="bg-green-600 hover:bg-green-700 text-white px-6 py-3 rounded-lg font-semibold transition"
        >
          Student Portal
        </button>
      </div>
    </div>
  );
};

// ----------------------------------------------------
// 2. The Main App Component (The Router)
// ----------------------------------------------------
function App() {
  return (
    <Router>
      {/* The background wrapper stays here so it applies to every page */}
      <div className="min-h-screen bg-gradient-to-r from-blue-100 to-blue-200 flex items-center justify-center p-6">
        
        {/* The Routes determine what shows up based on the URL */}
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route path="/admin-login" element={<AdminLogin />} />
          <Route path="/student-login" element={<StudentLogin />} />
          
          <Route 
            path="/admin-dashboard" 
            element={
              <div className="w-full max-w-5xl"><AdminDashboard /></div>
            } 
          />
          
          <Route 
            path="/student-dashboard" 
            element={
              <div className="w-full max-w-5xl"><StudentDashboard /></div>
            } 
          />
          <Route path="/student-register" element={<StudentRegister />} />
        </Routes>

      </div>
    </Router>
  );
}

export default App;