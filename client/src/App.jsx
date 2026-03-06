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
// 1. The Landing Page Component
// ----------------------------------------------------
const LandingPage = () => {
  const navigate = useNavigate();

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
// 2. Auth Layout Wrapper (Keeps the blue background only for login pages)
// ----------------------------------------------------
// ----------------------------------------------------
// 2. Auth Layout Wrapper (Fixes the white space on scroll)
// ----------------------------------------------------
const AuthLayout = ({ children }) => (
  // 'fixed inset-0' pins this blue layer to the screen so the white body can never peek through!
  <div className="fixed inset-0 bg-gradient-to-r from-blue-100 to-blue-200 overflow-y-auto flex items-center justify-center p-6">
    <div className="m-auto w-full flex justify-center">
      {children}
    </div>
  </div>
);

// ----------------------------------------------------
// 3. The Main App Component (The Router)
// ----------------------------------------------------
function App() {
  return (
    <Router>
      <Routes>
        {/* These routes get the blue gradient background and centering */}
        <Route path="/" element={<AuthLayout><LandingPage /></AuthLayout>} />
        <Route path="/admin-login" element={<AuthLayout><AdminLogin /></AuthLayout>} />
        <Route path="/student-login" element={<AuthLayout><StudentLogin /></AuthLayout>} />
        <Route path="/student-register" element={<AuthLayout><StudentRegister /></AuthLayout>} />
        
        {/* Dashboards are rendered WITHOUT restrictions so they can be full screen! */}
        <Route path="/admin-dashboard" element={<AdminDashboard />} />
        <Route path="/student-dashboard" element={<StudentDashboard />} />
      </Routes>
    </Router>
  );
}

export default App;