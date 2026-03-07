import React, { useState, useEffect, useCallback } from 'react';
import toast, { Toaster } from 'react-hot-toast';

const AdminProfile = () => {
  const adminId = sessionStorage.getItem('adminId') || 'ADMIN-001';
  
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({ name: adminId, email: '' });

  const fetchProfile = useCallback(async () => {
    try {
      const token = sessionStorage.getItem('adminToken');
      const response = await fetch(`http://localhost:5000/api/auth/profile/${adminId}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (response.ok) {
        const data = await response.json();
        setFormData({ name: data.name || adminId, email: data.email || '' });
      }
    } catch (error) {
      console.error("Failed to fetch admin profile");
    }
  }, [adminId]);

  useEffect(() => {
    fetchProfile();
  }, [fetchProfile]);

  const handleSave = async () => {
    try {
      const token = sessionStorage.getItem('adminToken');
      const response = await fetch(`http://localhost:5000/api/auth/profile/${adminId}`, {
        method: 'PUT',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        toast.success("Admin Profile updated successfully!");
        setIsEditing(false);
      } else {
        toast.error("Failed to update profile.");
      }
    } catch (error) {
      toast.error("Connection error.");
    }
  };

  return (
    <div className="animate-fade-in max-w-3xl mx-auto">
      <Toaster position="top-center" />
      <h1 className="text-4xl font-black text-slate-900 tracking-tight mb-8">Admin Profile</h1>
      
      <div className="bg-white p-10 rounded-[2.5rem] shadow-sm border border-slate-100 flex flex-col items-center text-center">
        {/* Avatar locked to Blue Theme */}
        <div className="w-32 h-32 rounded-full bg-gradient-to-tr from-blue-500 to-indigo-600 flex items-center justify-center text-white text-5xl font-bold shadow-xl mb-6 border-4 border-white outline outline-4 outline-blue-50">
          {formData.name.charAt(0).toUpperCase()}
        </div>
        
        <h2 className="text-3xl font-black text-slate-800 mb-2">{formData.name}</h2>
        <span className="bg-blue-50 text-blue-600 font-bold px-4 py-1.5 rounded-full text-sm uppercase tracking-widest mb-8">Super Admin</span>

        <div className="w-full max-w-md bg-slate-50 rounded-2xl p-6 text-left border border-slate-100 relative">
          {!isEditing && (
            <button onClick={() => setIsEditing(true)} className="absolute top-6 right-6 text-xs font-bold text-blue-600 bg-blue-100/50 hover:bg-blue-100 px-3 py-1.5 rounded-lg transition-colors uppercase tracking-wider">
              Edit
            </button>
          )}

          <div className="mb-6">
            <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">Admin ID</label>
            {isEditing ? (
              <input type="text" value={formData.name} onChange={(e) => setFormData({...formData, name: e.target.value})} className="w-full mt-1 bg-white border border-slate-300 rounded-lg px-3 py-2 text-slate-800 font-semibold focus:ring-2 focus:ring-blue-500 outline-none" />
            ) : <p className="text-lg font-semibold text-slate-800">{formData.name}</p>}
          </div>

          <div className="mb-6">
            <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">Email Address</label>
            {isEditing ? (
              <input type="email" value={formData.email} onChange={(e) => setFormData({...formData, email: e.target.value})} className="w-full mt-1 bg-white border border-slate-300 rounded-lg px-3 py-2 text-slate-800 font-semibold focus:ring-2 focus:ring-blue-500 outline-none" />
            ) : <p className="text-lg font-semibold text-slate-800">{formData.email || 'admin@fci-india.org'}</p>}
          </div>

          <div className="mb-6">
            <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">System Access</label>
            <p className="text-lg font-semibold text-slate-800">Full Dashboard Privileges</p>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">Status</label>
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-green-500"></span>
              <p className="text-lg font-semibold text-slate-800">Active Online</p>
            </div>
          </div>
        </div>

        {isEditing && (
          <div className="flex gap-4 w-full max-w-md mt-6 animate-fade-in">
            <button onClick={() => setIsEditing(false)} className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold py-3.5 rounded-xl transition-all">Cancel</button>
            <button onClick={handleSave} className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-bold py-3.5 rounded-xl transition-all shadow-lg shadow-blue-500/30">Save Details</button>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminProfile;