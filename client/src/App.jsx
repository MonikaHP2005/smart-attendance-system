import { BrowserRouter as Router, Routes, Route, useNavigate } from "react-router-dom";

// Importing the Pages
import AdminDashboard from "./pages/AdminDashboard";
import StudentDashboard from "./pages/StudentDashboard";
import AdminLogin from "./pages/AdminLogin";
import OrganiserLogin from "./pages/OrganiserLogin"; // 🔥 Make sure to create this file
import StudentLogin from "./pages/StudentLogin";
import StudentRegister from "./pages/StudentRegister";

// Importing the Logo
import fciLogo from "./assets/fci-logo.jpeg";

// ----------------------------------------------------
// 1. The Landing Page Component
// ----------------------------------------------------
const LandingPage = () => {
  const navigate = useNavigate();

  return (
    // 🔥 Increased max-width to 'max-w-2xl' to comfortably fit 3 buttons side-by-side
    <div className="bg-white shadow-2xl rounded-[2.5rem] p-12 text-center w-full max-w-2xl">
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
      
      {/* 🔥 Use a grid to keep all buttons perfectly aligned and equal in size */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <button
          onClick={() => navigate("/admin-login")}
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-3 rounded-xl font-bold transition-all active:scale-95 shadow-md"
        >
          Admin Panel
        </button>

        {/* 🔥 PURPLE ORGANISER BUTTON */}
        <button
          onClick={() => navigate("/organiser-login")}
          className="bg-[#9333EA] hover:bg-[#7E22CE] text-white px-4 py-3 rounded-xl font-bold transition-all shadow-lg active:scale-95"
        >
          Organiser Portal
        </button>

        <button
          onClick={() => navigate("/student-login")}
          className="bg-green-600 hover:bg-green-700 text-white px-4 py-3 rounded-xl font-bold transition-all active:scale-95 shadow-md"
        >
          Student Portal
        </button>
      </div>
    </div>
  );
};

// ----------------------------------------------------
// 2. Auth Layout Wrapper
// ----------------------------------------------------
const AuthLayout = ({ children }) => (
  <div className="fixed inset-0 bg-gradient-to-r from-blue-100 to-blue-200 overflow-y-auto flex items-center justify-center p-6">
    <div className="m-auto w-full flex justify-center">
      {children}
    </div>
  </div>
);

// ----------------------------------------------------
// 3. The Main App Component
// ----------------------------------------------------
function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<AuthLayout><LandingPage /></AuthLayout>} />
        <Route path="/admin-login" element={<AuthLayout><AdminLogin /></AuthLayout>} />
        
        {/* 🔥 Added Route for Organiser Login */}
        <Route path="/organiser-login" element={<AuthLayout><OrganiserLogin /></AuthLayout>} />
        
        <Route path="/student-login" element={<AuthLayout><StudentLogin /></AuthLayout>} />
        <Route path="/student-register" element={<AuthLayout><StudentRegister /></AuthLayout>} />
        
        <Route path="/admin-dashboard" element={<AdminDashboard />} />
        <Route path="/student-dashboard" element={<StudentDashboard />} />
      </Routes>
    </Router>
  );
}

export default App;