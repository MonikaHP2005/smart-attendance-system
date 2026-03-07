import React, { useState, useEffect, useCallback } from 'react';
import toast, { Toaster } from 'react-hot-toast';

const OrganiserProfile = () => {
  // Use adminId from storage as the unique lookup key
    const organiserId = localStorage.getItem('adminId');  
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({ 
    id: organiserId, 
    name: '', // Will hold the real Full Name
    email: '' 
  });

  // Inside OrganiserProfile.jsx

    const fetchProfile = useCallback(async () => {
        try {
            const token = localStorage.getItem('adminToken');
            const response = await fetch(`http://localhost:5000/api/auth/profile/${organiserId}`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const data = await response.json();
            
            if (response.ok) {
                // 🔥 This ensures the state is updated with what's in the DB
                setFormData({
                    id: organiserId,
                    name: data.name || '',
                    email: data.email || ''
                });
            }
        } catch (error) {
            console.error("Fetch failed");
        }
    }, [organiserId]);


  useEffect(() => { fetchProfile(); }, [fetchProfile]);

  const handleSave = async () => {
    try {
      const token = localStorage.getItem('adminToken');
      // 🔥 Ensure this URL matches your backend route exactly!
      const response = await fetch(`http://localhost:5000/api/auth/profile/${formData.id}`, {
        method: 'PUT',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          name: formData.name,
          email: formData.email
        }),
      });

      if (response.ok) {
        toast.success("Details saved to database!");
        setIsEditing(false);
        fetchProfile(); // 🔥 Refresh the screen after saving
      } else {
        toast.error("Server rejected the update.");
      }
    } catch (error) {
        toast.error("Check if your Backend Server is running!");
    }
  };

  return (
    <div className="animate-fade-in max-w-3xl mx-auto">
      <Toaster position="top-center" />
      <h1 className="text-4xl font-black text-slate-900 tracking-tight mb-8">Organiser Profile</h1>
      
      <div className="bg-white p-10 rounded-[2.5rem] shadow-sm border border-slate-100 flex flex-col items-center text-center">
        {/* Profile Avatar logic */}
        <div className="w-32 h-32 rounded-full bg-gradient-to-tr from-purple-500 to-fuchsia-600 flex items-center justify-center text-white text-5xl font-bold shadow-xl mb-6 border-4 border-white outline outline-4 outline-purple-50">
          {formData.name ? formData.name.charAt(0).toUpperCase() : 'O'}
        </div>

        {/* Displays Name if exists, otherwise ID */}
        <h2 className="text-3xl font-black text-slate-800 mb-2">
          {formData.name || formData.id}
        </h2>
        <span className="bg-purple-50 text-purple-600 font-bold px-4 py-1.5 rounded-full text-sm uppercase tracking-widest mb-8">Organiser</span>

        <div className="w-full max-w-md bg-slate-50 rounded-2xl p-6 text-left border border-slate-100 relative">
          {!isEditing && (
            <button onClick={() => setIsEditing(true)} className="absolute top-6 right-6 text-xs font-bold text-purple-600 bg-purple-100/50 px-3 py-1.5 rounded-lg hover:bg-purple-100 transition-colors">
              EDIT PROFILE
            </button>
          )}

          <div className="mb-6">
            <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">Full Name</label>
            {isEditing ? (
              <input type="text" value={formData.name} onChange={(e) => setFormData({...formData, name: e.target.value})} className="w-full mt-1 bg-white border border-slate-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-purple-500 outline-none text-slate-800 font-semibold" placeholder="Enter Full Name" />
            ) : <p className="text-lg font-semibold text-slate-800">{formData.name || 'Not set'}</p>}
          </div>

          <div className="mb-6">
            <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">Email Address</label>
            {isEditing ? (
              <input type="email" value={formData.email} onChange={(e) => setFormData({...formData, email: e.target.value})} className="w-full mt-1 bg-white border border-slate-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-purple-500 outline-none text-slate-800 font-semibold" placeholder="example@domain.com" />
            ) : <p className="text-lg font-semibold text-slate-800">{formData.email || 'Not set'}</p>}
          </div>

          <div className="mb-6">
            <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">Organiser ID (Locked)</label>
            <p className="text-lg font-semibold text-slate-500">{formData.id}</p>
          </div>

          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-full bg-green-500"></span>
            <p className="text-lg font-semibold text-slate-800">Staff Access Active</p>
          </div>
        </div>

        {isEditing && (
          <div className="flex gap-4 w-full max-w-md mt-6 animate-fade-in">
            <button onClick={() => setIsEditing(false)} className="flex-1 bg-slate-100 text-slate-700 font-bold py-3.5 rounded-xl">Cancel</button>
            <button onClick={handleSave} className="flex-1 bg-purple-600 text-white font-bold py-3.5 rounded-xl shadow-lg shadow-purple-500/20">Save Details</button>
          </div>
        )}
      </div>
    </div>
  );
};

export default OrganiserProfile;