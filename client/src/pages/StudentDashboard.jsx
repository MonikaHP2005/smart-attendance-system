import React, { useState, useEffect, useCallback, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { Scanner } from "@yudiel/react-qr-scanner";
import toast, { Toaster } from "react-hot-toast";

function StudentDashboard() {
  const navigate = useNavigate();

  // 🔥 THE FRONTEND BOUNCER - Looks for studentToken
  useEffect(() => {
    const token = localStorage.getItem('studentToken');
    if (!token) {
      navigate('/student-login'); 
    }
  }, [navigate]);
  
  const [activeTab, setActiveTab] = useState('home'); 
  const [popupData, setPopupData] = useState(null); 
  
  const [stats, setStats] = useState({ percentage: 0, attended: 0, total: 0 });
  const [history, setHistory] = useState([]);
  const [cameraMode, setCameraMode] = useState("environment");
  const instantLock = useRef(false); 
  
  // 🔥 Read the specific studentId
  const studentId = localStorage.getItem("studentId") || "Student";
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [profileData, setProfileData] = useState({ name: studentId, email: '' });
  
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [passwordData, setPasswordData] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' });

  const fetchStats = useCallback(async () => {
    if (!studentId || studentId === "Student") return; 
    try {
      const token = localStorage.getItem('studentToken'); // 🔥 Use studentToken
      const response = await fetch(`http://localhost:5000/api/events/student-stats/${studentId}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (response.ok) {
        const data = await response.json();
        setStats({ percentage: data.percentage, attended: data.attended, total: data.total });
        setHistory(data.history);
      }
    } catch (error) {
      console.error("Failed to fetch stats");
    }
  }, [studentId]);

  const fetchProfile = useCallback(async () => {
    if (!studentId || studentId === "Student") return;
    try {
      const token = localStorage.getItem('studentToken'); // 🔥 Use studentToken
      const response = await fetch(`http://localhost:5000/api/auth/profile/${studentId}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (response.ok) {
        const data = await response.json();
        setProfileData({ name: data.name || studentId, email: data.email || '' });
      }
    } catch (error) {
      console.error("Failed to fetch profile data");
    }
  }, [studentId]);

  useEffect(() => { 
    fetchStats(); 
    fetchProfile();
  }, [fetchStats, fetchProfile]);

  const handleScan = async (result) => {
    if (!result || instantLock.current || popupData) return;
    try {
      instantLock.current = true;
      let qrText = typeof result === "string" ? result : result[0]?.rawValue || result?.text;
      if (!qrText) throw new Error("Could not extract text");

      toast.loading("Verifying Location...", { id: "scan-toast" });
      const { eventId, qrToken } = JSON.parse(qrText); 
      if (!eventId || !qrToken) throw new Error("Invalid Format");

      navigator.geolocation.getCurrentPosition(
        async (position) => {
          try {
            const token = localStorage.getItem('studentToken'); // 🔥 Use studentToken
            const response = await fetch("http://localhost:5000/api/events/attend", {
              method: "POST",
              headers: { 
                "Content-Type": "application/json",
                "Authorization": `Bearer ${token}`
              },
              body: JSON.stringify({ 
                eventId, qrToken, 
                studentLat: position.coords.latitude, 
                studentLon: position.coords.longitude, 
                studentId 
              }),
            });
            const data = await response.json();
            toast.dismiss("scan-toast"); 

            if (response.ok) {
              setPopupData({ title: data.action === "CHECK_IN" ? "Checked In!" : "Checked Out!", message: data.message, type: "success" });
              fetchStats(); 
            } else {
              setPopupData({ title: "Failed", message: data.message, type: "error" });
            }
          } catch (err) {
            toast.dismiss("scan-toast");
            setPopupData({ title: "Connection Error", message: "Could not reach server.", type: "error" });
          }
        },
        () => {
          toast.dismiss("scan-toast");
          setPopupData({ title: "GPS Required", message: "Please allow location access.", type: "error" });
        },
        { enableHighAccuracy: true } 
      );
    } catch (error) {
      toast.dismiss("scan-toast");
      setPopupData({ title: "Invalid QR Code", message: "Unrecognized code format.", type: "error" });
    }
  };

  const handleSaveProfile = async () => {
    try {
      const token = localStorage.getItem('studentToken'); // 🔥 Use studentToken
      const response = await fetch(`http://localhost:5000/api/auth/profile/${studentId}`, {
        method: 'PUT',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(profileData),
      });
      if (response.ok) {
        toast.success("Profile updated successfully!");
        setIsEditingProfile(false);
      } else {
        toast.error("Failed to update profile.");
      }
    } catch (error) {
      toast.error("Failed to update profile.");
    }
  };

  const handleUpdatePassword = async () => {
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      toast.error("New passwords do not match!");
      return;
    }
    try {
      const token = localStorage.getItem('studentToken'); // 🔥 Use studentToken
      const response = await fetch(`http://localhost:5000/api/auth/change-password/${studentId}`, {
        method: 'PUT',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ 
          currentPassword: passwordData.currentPassword, 
          newPassword: passwordData.newPassword 
        }),
      });
      const data = await response.json();
      if (response.ok) {
        toast.success("Password secured!");
        setIsChangingPassword(false);
        setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' });
      } else {
        toast.error(data.message || "Failed to update password.");
      }
    } catch (error) {
      toast.error("Server connection error.");
    }
  };

  const handleLogout = () => {
    // 🔥 Clear specific student memory
    localStorage.removeItem('studentToken');
    localStorage.removeItem('studentId');
    navigate('/student-login');
  };

  const renderHome = () => (
    <div className="animate-fade-in space-y-8 pb-24 md:pb-8">
      <div className="bg-gradient-to-r from-green-700 to-green-600 p-8 sm:p-10 rounded-[2rem] shadow-lg shadow-green-600/20 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6 relative overflow-hidden">
        <div className="absolute -top-10 -right-10 w-40 h-40 bg-white opacity-10 rounded-full blur-xl pointer-events-none"></div>
        <div className="relative z-10">
          <p className="text-green-100 font-bold text-xs uppercase tracking-widest mb-1.5">Welcome back,</p>
          <h2 className="text-3xl sm:text-4xl font-black text-white tracking-tight">{profileData.name}</h2>
          <p className="text-green-50 mt-2 font-medium text-sm">Ready to mark your attendance for today?</p>
        </div>
        <button onClick={() => setActiveTab('scan')} className="relative z-10 bg-white text-green-700 hover:bg-green-50 font-black text-sm uppercase tracking-wider px-6 py-4 rounded-xl shadow-md transition-all active:scale-95 flex items-center gap-2">
          <span className="text-xl">📷</span> Open Scanner
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
        <div className="bg-white p-8 rounded-3xl shadow-sm border border-slate-100 border-t-4 border-t-green-500 flex flex-col justify-center">
          <div className="flex justify-between items-center mb-4">
            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Overall Attendance</p>
            <span className="w-8 h-8 rounded-full bg-green-50 text-green-600 flex items-center justify-center text-lg">📊</span>
          </div>
          <div className="flex items-end gap-2">
            <span className="text-5xl font-black text-slate-800 tracking-tighter leading-none">{stats.percentage}%</span>
          </div>
          <div className="w-full bg-slate-100 rounded-full h-2 mt-5">
            <div className="bg-green-500 h-full rounded-full transition-all duration-1000" style={{ width: `${stats.percentage}%` }}></div>
          </div>
        </div>

        <div className="bg-white p-8 rounded-3xl shadow-sm border border-slate-100 border-t-4 border-t-blue-500 flex flex-col justify-center">
          <div className="flex justify-between items-center mb-4">
            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Classes Attended</p>
            <span className="w-8 h-8 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center text-lg">📚</span>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-5xl font-black text-slate-800 tracking-tighter leading-none">{stats.attended}</span>
            <span className="text-lg font-bold text-slate-400">/ {stats.total}</span>
          </div>
          <p className="text-xs text-slate-400 mt-5 font-bold uppercase tracking-widest">Total Sessions Hosted</p>
        </div>
      </div>

      <div className="bg-white p-8 rounded-3xl shadow-sm border border-slate-100">
        <h3 className="text-xl font-black text-slate-800 mb-6 tracking-tight">Recent Check-ins</h3>
        {history.length > 0 ? (
          <div className="space-y-4">
            {history.slice(0, 5).map((item, i) => (
              <div key={i} className="flex justify-between items-center p-5 rounded-2xl bg-slate-50 border border-slate-100 hover:border-green-200 hover:shadow-sm transition-all">
                <div>
                  <h4 className="font-bold text-slate-800 text-lg">{item.title}</h4>
                  <p className="text-sm text-slate-500 font-medium mt-1">
                    {new Date(item.check_in_time).toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' })}
                  </p>
                </div>
                <span className="bg-green-100 text-green-700 px-4 py-1.5 rounded-lg text-xs font-bold uppercase tracking-wider shadow-sm">
                  {item.status}
                </span>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-10 bg-slate-50 rounded-2xl border border-dashed border-slate-200">
            <span className="text-5xl mb-3 block opacity-50">📋</span>
            <p className="text-slate-500 font-medium">You haven't checked in to any classes yet.</p>
          </div>
        )}
      </div>
    </div>
  );

  const renderScanner = () => (
    <div className="animate-fade-in flex flex-col h-[calc(100vh-120px)] justify-center pb-24 md:pb-8">
      <div className="bg-slate-900 rounded-[2.5rem] p-6 sm:p-8 shadow-2xl border border-slate-800 max-w-md mx-auto w-full relative overflow-hidden">
        <div className="text-center mb-6">
          <h2 className="text-2xl font-black text-white tracking-tight mb-1">Scan to Attend</h2>
          <p className="text-slate-400 text-sm font-medium">Align the QR code in the frame</p>
        </div>
        <div className="rounded-3xl overflow-hidden border-4 border-slate-700 bg-black aspect-square relative shadow-inner">
            <Scanner onScan={handleScan} constraints={{ facingMode: cameraMode }} />
            <div className="absolute inset-0 border-[40px] border-black/50 z-10 pointer-events-none"></div>
            <div className="absolute inset-1/4 border-2 border-green-500/50 rounded-xl z-20 pointer-events-none"></div>
        </div>
        <button onClick={() => setCameraMode(prev => prev === "environment" ? "user" : "environment")} className="w-full mt-8 bg-slate-800 hover:bg-slate-700 text-white font-bold py-4 rounded-2xl transition-colors flex items-center justify-center gap-2 border border-slate-700">
          🔄 Flip Camera
        </button>
      </div>
    </div>
  );

  const renderProfile = () => (
    <div className="animate-fade-in space-y-6 pb-24 md:pb-8 max-w-2xl mx-auto">
      <div className="bg-white p-8 rounded-[2rem] shadow-sm border border-slate-100 relative border-t-4 border-t-green-600">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h3 className="text-2xl font-black text-slate-800">Student Profile</h3>
            <p className="text-sm font-medium text-slate-500 mt-1">Manage your personal details</p>
          </div>
          {!isEditingProfile && (
            <button onClick={() => setIsEditingProfile(true)} className="text-xs font-bold uppercase tracking-wider text-green-700 bg-green-50 hover:bg-green-100 border border-green-200 px-4 py-2 rounded-xl transition-colors">
              Edit Details
            </button>
          )}
        </div>
        <div className="space-y-6">
          <div>
            <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">Full Name</label>
            {isEditingProfile ? (
              <input type="text" value={profileData.name} onChange={(e) => setProfileData({...profileData, name: e.target.value})} className="w-full bg-white border border-slate-300 rounded-xl px-4 py-3 text-slate-800 font-semibold focus:outline-none focus:border-green-500 focus:ring-1 focus:ring-green-500 shadow-sm transition-all" />
            ) : <p className="text-lg font-semibold text-slate-800 bg-slate-50 px-4 py-3 rounded-xl border border-slate-100">{profileData.name}</p>}
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">Email Address</label>
            {isEditingProfile ? (
              <input type="email" value={profileData.email} onChange={(e) => setProfileData({...profileData, email: e.target.value})} className="w-full bg-white border border-slate-300 rounded-xl px-4 py-3 text-slate-800 font-semibold focus:outline-none focus:border-green-500 focus:ring-1 focus:ring-green-500 shadow-sm transition-all" />
            ) : <p className="text-lg font-semibold text-slate-800 bg-slate-50 px-4 py-3 rounded-xl border border-slate-100">{profileData.email}</p>}
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">Roll Number</label>
            <p className="text-lg font-semibold text-slate-800 bg-slate-50 px-4 py-3 rounded-xl border border-slate-100">{studentId} <span className="text-xs text-slate-400 ml-2 font-normal">(System Locked)</span></p>
          </div>
        </div>
        {isEditingProfile && (
          <div className="flex gap-4 mt-8 pt-6 border-t border-slate-100">
            <button onClick={() => setIsEditingProfile(false)} className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold py-3.5 rounded-xl transition-colors">Cancel</button>
            <button onClick={handleSaveProfile} className="flex-1 bg-green-600 hover:bg-green-700 text-white font-bold py-3.5 rounded-xl shadow-lg shadow-green-600/30 transition-all active:scale-95">Save Changes</button>
          </div>
        )}
      </div>

      <div className="bg-white p-8 rounded-[2rem] shadow-sm border border-slate-100 border-t-4 border-t-slate-800">
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-xl font-black text-slate-800">Security</h3>
          {!isChangingPassword && (
            <button onClick={() => setIsChangingPassword(true)} className="text-xs font-bold uppercase tracking-wider text-slate-600 bg-slate-100 hover:bg-slate-200 px-4 py-2 rounded-xl transition-colors">
              Update Password
            </button>
          )}
        </div>
        {isChangingPassword ? (
          <div className="space-y-4 animate-fade-in pt-4">
            <input type="password" placeholder="Current Password" value={passwordData.currentPassword} onChange={(e) => setPasswordData({...passwordData, currentPassword: e.target.value})} className="w-full bg-white border border-slate-300 rounded-xl px-4 py-3 text-slate-800 font-medium focus:outline-none focus:border-slate-800 focus:ring-1 focus:ring-slate-800 shadow-sm" />
            <input type="password" placeholder="New Password" value={passwordData.newPassword} onChange={(e) => setPasswordData({...passwordData, newPassword: e.target.value})} className="w-full bg-white border border-slate-300 rounded-xl px-4 py-3 text-slate-800 font-medium focus:outline-none focus:border-slate-800 focus:ring-1 focus:ring-slate-800 shadow-sm" />
            <input type="password" placeholder="Confirm New Password" value={passwordData.confirmPassword} onChange={(e) => setPasswordData({...passwordData, confirmPassword: e.target.value})} className="w-full bg-white border border-slate-300 rounded-xl px-4 py-3 text-slate-800 font-medium focus:outline-none focus:border-slate-800 focus:ring-1 focus:ring-slate-800 shadow-sm" />
            <div className="flex gap-4 mt-6 pt-6 border-t border-slate-100">
              <button onClick={() => setIsChangingPassword(false)} className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold py-3.5 rounded-xl transition-colors">Cancel</button>
              <button onClick={handleUpdatePassword} className="flex-1 bg-slate-800 hover:bg-slate-900 text-white font-bold py-3.5 rounded-xl shadow-lg shadow-slate-800/30 transition-all active:scale-95">Secure Password</button>
            </div>
          </div>
        ) : (
          <p className="text-sm text-slate-500 font-medium">Regularly updating your password helps secure your attendance records.</p>
        )}
      </div>

      <button onClick={handleLogout} className="w-full bg-red-50 text-red-600 font-black tracking-wide py-4 rounded-2xl border border-red-100 hover:bg-red-100 transition-colors uppercase text-sm">
        Sign Out of Portal
      </button>
    </div>
  );

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col md:flex-row font-sans">
      <Toaster position="top-center" />

      {popupData && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 animate-fade-in">
          <div className="bg-white rounded-[2rem] p-8 max-w-sm w-full text-center shadow-2xl">
            <div className={`mx-auto flex items-center justify-center h-24 w-24 rounded-full mb-6 ${popupData.type === 'success' ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600'}`}>
              <span className="text-5xl">{popupData.type === 'success' ? '✓' : '✕'}</span>
            </div>
            <h3 className="text-2xl font-black text-slate-900 mb-2 tracking-tight">{popupData.title}</h3>
            <p className="text-slate-500 mb-8 font-medium">{popupData.message}</p>
            <button onClick={() => { setPopupData(null); instantLock.current = false; setActiveTab('home'); }} className="w-full py-4 rounded-xl text-white font-black text-sm uppercase tracking-wider bg-slate-900 hover:bg-black transition-all active:scale-95">
              Continue
            </button>
          </div>
        </div>
      )}

      <aside className="hidden md:flex w-72 bg-green-900 text-green-50 border-r border-green-800 flex-col h-screen sticky top-0 shadow-2xl z-20">
        <div className="p-8 pb-10">
          <h1 className="text-3xl font-black text-white tracking-tight">FCI Portal</h1>
          <p className="text-xs font-bold text-green-300 tracking-widest uppercase mt-1">Student Access</p>
        </div>
        <nav className="flex-1 px-4 space-y-2">
          <button onClick={() => setActiveTab('home')} className={`w-full flex items-center gap-4 px-6 py-4 rounded-2xl font-bold transition-all ${activeTab === 'home' ? 'bg-green-800 text-white shadow-inner' : 'text-green-200 hover:bg-green-800/50 hover:text-white'}`}>
            <span className="text-xl">📊</span> Dashboard
          </button>
          <button onClick={() => setActiveTab('scan')} className={`w-full flex items-center gap-4 px-6 py-4 rounded-2xl font-bold transition-all ${activeTab === 'scan' ? 'bg-green-800 text-white shadow-inner' : 'text-green-200 hover:bg-green-800/50 hover:text-white'}`}>
            <span className="text-xl">📷</span> Scanner
          </button>
          <button onClick={() => setActiveTab('profile')} className={`w-full flex items-center gap-4 px-6 py-4 rounded-2xl font-bold transition-all ${activeTab === 'profile' ? 'bg-green-800 text-white shadow-inner' : 'text-green-200 hover:bg-green-800/50 hover:text-white'}`}>
            <span className="text-xl">👤</span> Profile
          </button>
        </nav>
        <div className="p-4 border-t border-green-800/50">
           <button onClick={handleLogout} className="w-full flex items-center gap-3 px-6 py-4 rounded-2xl font-bold text-red-300 hover:bg-red-900/30 transition-all">
            <span className="text-xl">🚪</span> Sign Out
          </button>
        </div>
      </aside>

      <main className="flex-1 p-4 sm:p-8 md:p-12 overflow-y-auto">
        <div className="max-w-4xl mx-auto w-full">
          {activeTab === 'home' && renderHome()}
          {activeTab === 'scan' && renderScanner()}
          {activeTab === 'profile' && renderProfile()}
        </div>
      </main>

      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-slate-200 pb-safe z-40 px-6 py-3 flex justify-between items-center shadow-[0_-10px_40px_rgba(0,0,0,0.05)]">
        <button onClick={() => setActiveTab('home')} className={`flex flex-col items-center gap-1 transition-colors ${activeTab === 'home' ? 'text-green-600' : 'text-slate-400'}`}>
          <span className="text-2xl">📊</span>
          <span className="text-[10px] font-black uppercase tracking-wider">Home</span>
        </button>
        <button onClick={() => setActiveTab('scan')} className="bg-green-600 text-white w-16 h-16 rounded-full flex items-center justify-center text-2xl shadow-lg shadow-green-600/30 transform -translate-y-6 border-4 border-slate-50 active:scale-95 transition-transform">
          📷
        </button>
        <button onClick={() => setActiveTab('profile')} className={`flex flex-col items-center gap-1 transition-colors ${activeTab === 'profile' ? 'text-green-600' : 'text-slate-400'}`}>
          <span className="text-2xl">👤</span>
          <span className="text-[10px] font-black uppercase tracking-wider">Profile</span>
        </button>
      </nav>
    </div>
  );
}

export default StudentDashboard;