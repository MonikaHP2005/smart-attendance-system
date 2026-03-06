import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import toast, { Toaster } from 'react-hot-toast';

const StudentRegister = () => {
  // YOUR EXACT STATE AND LOGIC - 100% UNTOUCHED
  const [formData, setFormData] = useState({
    studentId: '',
    name: '',
    email: '',
    batch: '',
    password: '',
  });
  const [showPassword, setShowPassword] = useState(false);
  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    try {
      const response = await fetch('http://localhost:5000/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (response.ok) {
        toast.success("Registration Successful!");
        setTimeout(() => navigate('/student-login'), 1500);
      } else {
        toast.error(data.message || 'Registration failed');
      }
    } catch (err) {
      toast.error('Cannot connect to the server.');
    }
  };

  // ONLY THE UI HAS BEEN UPGRADED BELOW
  return (
    <div className="bg-white p-10 rounded-[2rem] shadow-2xl w-full max-w-md border border-white/50 relative overflow-hidden animate-fade-in my-8">
      <Toaster position="top-center" />
      
      {/* Emerald Student Theme Gradient Bar */}
      <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-emerald-500 to-green-500"></div>

      <div className="text-center mb-8 mt-2">
        <h2 className="text-3xl font-black text-slate-900 tracking-tight">Student Signup</h2>
        <p className="text-slate-500 font-medium mt-2 tracking-wide text-sm">Create your portal account</p>
      </div>

      <form className="space-y-4" onSubmit={handleRegister}>
        
        {/* Student ID / Roll No */}
        <div>
          <label className="block text-[10px] font-bold text-slate-500 mb-1.5 uppercase tracking-widest">
            Student ID (Roll No)
          </label>
          <input 
            type="text" 
            name="studentId" 
            required 
            value={formData.studentId} 
            onChange={handleChange}
            className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-all font-semibold text-slate-900 text-sm"
            placeholder="e.g. FCI_001" 
          />
        </div>

        {/* Full Name */}
        <div>
          <label className="block text-[10px] font-bold text-slate-500 mb-1.5 uppercase tracking-widest">
            Full Name
          </label>
          <input 
            type="text" 
            name="name" 
            required 
            value={formData.name} 
            onChange={handleChange}
            className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-all font-semibold text-slate-900 text-sm"
            placeholder="John Doe" 
          />
        </div>

        {/* Batch / Section */}
        <div>
          <label className="block text-[10px] font-bold text-slate-500 mb-1.5 uppercase tracking-widest">
            Batch 
          </label>
          <input 
            type="text" 
            name="batch" 
            required 
            value={formData.batch} 
            onChange={handleChange}
            className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-all font-semibold text-slate-900 text-sm"
            placeholder="e.g. B5" 
          />
        </div>

        {/* Email Address */}
        <div>
          <label className="block text-[10px] font-bold text-slate-500 mb-1.5 uppercase tracking-widest">
            Email Address
          </label>
          <input 
            type="email" 
            name="email" 
            required 
            value={formData.email} 
            onChange={handleChange}
            className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-all font-semibold text-slate-900 text-sm"
            placeholder="student@college.edu" 
          />
        </div>
        
        {/* Password */}
        <div>
          <label className="block text-[10px] font-bold text-slate-500 mb-1.5 uppercase tracking-widest">
            Password
          </label>
          <div className="relative">
            <input
              type={showPassword ? "text" : "password"}
              name="password"
              required
              value={formData.password}
              onChange={handleChange}
              className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-all font-semibold text-slate-900 text-sm pr-12"
              placeholder="Create a password"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-4 top-1/2 -translate-y-1/2 text-xs font-bold text-emerald-600 hover:text-emerald-800 transition-colors"
            >
              {showPassword ? "Hide" : "Show"}
            </button>
          </div>
        </div>

        <button 
          type="submit" 
          className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-3.5 rounded-xl transition-all hover:shadow-lg hover:shadow-emerald-500/30 active:scale-[0.98] mt-4"
        >
          Create Account
        </button>
      </form>

      {/* Login Link */}
      <div className="mt-6 text-center">
         <p className="text-slate-500 text-sm font-medium">
           Already have an account?{" "}
           <Link to="/student-login" className="font-medium text-emerald-600 hover:text-emerald-800 hover:underline transition-colors">
             Log in
           </Link>
         </p>
      </div>
      
      {/* Back to Portal Pill Button */}
      <div className="mt-6 text-center pb-2">
         <button 
           onClick={() => navigate("/")}
           className="bg-slate-100 hover:bg-slate-200 text-slate-600 font-bold text-xs px-5 py-2.5 rounded-full transition-all flex items-center justify-center gap-2 mx-auto hover:shadow-sm active:scale-95"
         >
           Back to Main Portal
         </button>
      </div>
    </div>
  );
};

export default StudentRegister;