import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import toast, { Toaster } from 'react-hot-toast';
import fciLogo from "../assets/fci-logo.jpeg";

const OrganiserLogin = () => {
  const [organiserId, setOrganiserId] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const response = await fetch('http://localhost:5000/api/auth/organiser-login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ organiserId, password }),
      });

      const data = await response.json();

      if (response.ok) {
        // 🔥 STEP 1: Wipe all old memory (removes old 'STUDENT' roles)
        localStorage.clear(); 
        sessionStorage.clear();

        // 🔥 STEP 2: Save to localStorage so it stays after a refresh
        localStorage.setItem('adminToken', data.token); 
        localStorage.setItem('adminId', data.user.id);
        localStorage.setItem('userRole', 'organiser'); 
        
        toast.success(`Welcome back, ${data.user.name}!`);
        
        // Short delay to let storage settle before navigating
        setTimeout(() => navigate('/admin-dashboard'), 1000);
      } else {
        toast.error(data.message || "Invalid Organiser Credentials");
      }
    } catch (error) {
      toast.error("Server connection failed");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="bg-white shadow-2xl rounded-[2.5rem] p-10 w-full max-w-md animate-fade-in">
      <Toaster position="top-center" />
      <div className="text-center mb-8">
        <img src={fciLogo} alt="FCI Logo" className="w-20 h-20 mx-auto mb-4 object-contain" />
        <h2 className="text-3xl font-black text-slate-900 tracking-tight">Organiser Portal</h2>
        <p className="text-slate-500 font-medium">Enter your credentials to manage sessions</p>
      </div>

      <form onSubmit={handleLogin} className="space-y-5">
        <div>
          <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-2 ml-1">Organiser ID</label>
          <input
            type="text"
            required
            className="w-full px-5 py-4 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-purple-500 focus:border-purple-500 outline-none transition-all font-semibold"
            placeholder="EMP-XXXX"
            value={organiserId}
            onChange={(e) => setOrganiserId(e.target.value)}
          />
        </div>

        <div>
          <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-2 ml-1">Password</label>
          <input
            type="password"
            required
            className="w-full px-5 py-4 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-purple-500 focus:border-purple-500 outline-none transition-all font-semibold"
            placeholder="••••••••"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
        </div>

        <button
          type="submit"
          disabled={isLoading}
          className="w-full bg-purple-600 hover:bg-purple-700 text-white font-black py-4 rounded-2xl shadow-lg shadow-purple-200 transition-all active:scale-95 disabled:opacity-50 disabled:active:scale-100"
        >
          {isLoading ? "Verifying..." : "Login to Portal"}
        </button>
      </form>

      <button 
        onClick={() => navigate('/')}
        className="w-full mt-6 text-slate-400 font-bold text-sm hover:text-slate-600 transition-colors"
      >
        Back to Main Portal
      </button>
    </div>
  );
};

export default OrganiserLogin;