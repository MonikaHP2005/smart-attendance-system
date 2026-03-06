import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import toast, { Toaster } from 'react-hot-toast';

const StudentLogin = () => {
  const [studentId, setStudentId] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    try {
      const response = await fetch('http://localhost:5000/api/auth/student-login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ studentId, password }),
      });

      const data = await response.json();

      if (response.ok) {
        // 🔥 CRITICAL FIX: Specific Student Memory
        localStorage.setItem('studentToken', data.token); 
        localStorage.setItem('studentId', data.user?.id || studentId); 
        localStorage.setItem('userRole', 'STUDENT');
        
        toast.success(`Welcome back, ${data.user?.name || studentId}!`);
        setTimeout(() => navigate('/student-dashboard'), 1000);
      } else {
        toast.error(data.message || "Login failed");
      }
    } catch (err) {
      toast.error("Cannot connect to the server.");
    }
  };

  return (
    <div className="bg-white p-10 rounded-[2rem] shadow-2xl w-full max-w-md border border-white/50 relative overflow-hidden animate-fade-in my-8">
      <Toaster position="top-center" />
      <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-emerald-500 to-green-500"></div>

      <div className="text-center mb-8 mt-2">
        <h2 className="text-3xl font-black text-slate-900 tracking-tight">Student Login</h2>
        <p className="text-slate-500 font-medium mt-2 tracking-wide">Log in with your Roll Number</p>
      </div>

      <form className="space-y-6" onSubmit={handleLogin}>
        <div>
          <label className="block text-xs font-bold text-slate-500 mb-2 uppercase tracking-widest">Student ID</label>
          <input type="text" required className="w-full px-5 py-4 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all font-semibold text-slate-900" value={studentId} onChange={(e) => setStudentId(e.target.value)} placeholder="e.g. FCI_001" />
        </div>
        <div>
          <label className="block text-xs font-bold text-slate-500 mb-2 uppercase tracking-widest">Password</label>
          <div className="relative">
            <input type={showPassword ? "text" : "password"} required className="w-full px-5 py-4 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all font-semibold text-slate-900" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="password" />
            <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-5 top-1/2 -translate-y-1/2 text-sm font-bold text-emerald-600 hover:text-emerald-800 transition-colors">
              {showPassword ? "Hide" : "Show"}
            </button>
          </div>
        </div>
        <button type="submit" className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-lg py-4 rounded-xl transition-all hover:shadow-lg hover:shadow-emerald-500/30 active:scale-[0.98]">Log In</button>
      </form>
      <div className="mt-6 text-center">
         <p className="text-slate-500 text-sm font-medium">Don't have an account? <Link to="/student-register" className="text-emerald-600 hover:text-emerald-800 font-bold hover:underline transition-colors">Sign up here</Link></p>
      </div>
      <div className="mt-6 text-center pb-2">
         <button onClick={() => navigate("/")} className="bg-slate-100 hover:bg-slate-200 text-slate-600 font-bold text-xs px-5 py-2.5 rounded-full transition-all flex items-center justify-center gap-2 mx-auto hover:shadow-sm active:scale-95">Back to Main Portal</button>
      </div>
    </div>
  );
};

export default StudentLogin;