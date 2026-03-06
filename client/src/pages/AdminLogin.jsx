import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import toast, { Toaster } from 'react-hot-toast';

const AdminLogin = () => {
  const [adminId, setAdminId] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    try {
      const response = await fetch('http://localhost:5000/api/auth/admin-login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ adminId, password }),
      });

      const data = await response.json();

      if (response.ok) {
        // 🔥 CRITICAL FIX: Specific Admin Memory
        localStorage.setItem('adminToken', data.token); 
        localStorage.setItem('adminId', data.user?.id || adminId); 
        localStorage.setItem('userRole', 'ADMIN');
        
        toast.success("Admin authorized.");
        setTimeout(() => navigate('/admin-dashboard'), 1000);
      } else {
        toast.error(data.message || "Invalid Admin credentials");
      }
    } catch (err) {
      toast.error("Connection error. Is the backend running?");
    }
  };

  return (
    <div className="bg-white p-10 rounded-[2rem] shadow-2xl w-full max-w-md border border-white/50 relative overflow-hidden animate-fade-in my-8">
      <Toaster position="top-center" />
      <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-blue-500 to-indigo-600"></div>

      <div className="text-center mb-8 mt-2">
        <h2 className="text-3xl font-black text-slate-900 tracking-tight">Admin Login</h2>
        <p className="text-slate-500 font-medium mt-2 tracking-wide">Secure Faculty Access</p>
      </div>

      <form className="space-y-6" onSubmit={handleLogin}>
        <div>
          <label className="block text-xs font-bold text-slate-500 mb-2 uppercase tracking-widest">Admin/Faculty ID</label>
          <input type="text" required className="w-full px-5 py-4 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all font-semibold text-slate-900" value={adminId} onChange={(e) => setAdminId(e.target.value)} placeholder="e.g. ADMIN-001" />
        </div>
        <div>
          <label className="block text-xs font-bold text-slate-500 mb-2 uppercase tracking-widest">Password</label>
          <div className="relative">
            <input type={showPassword ? "text" : "password"} required className="w-full px-5 py-4 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all font-semibold text-slate-900" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="password" />
            <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-5 top-1/2 -translate-y-1/2 text-sm font-bold text-blue-600 hover:text-blue-800 transition-colors">
              {showPassword ? "Hide" : "Show"}
            </button>
          </div>
        </div>
        <button type="submit" className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold text-lg py-4 rounded-xl transition-all hover:shadow-lg hover:shadow-blue-500/30 active:scale-[0.98]">Log In</button>
      </form>
      <div className="mt-8 text-center pb-2">
         <button onClick={() => navigate("/")} className="bg-slate-100 hover:bg-slate-200 text-slate-600 font-bold text-xs px-5 py-2.5 rounded-full transition-all flex items-center justify-center gap-2 mx-auto hover:shadow-sm active:scale-95">Back to Main Portal</button>
      </div>
    </div>
  );
};

export default AdminLogin;