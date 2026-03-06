import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

const Sidebar = ({ activeTab, setActiveTab }) => {
  const navigate = useNavigate();
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const adminId = localStorage.getItem('userId') || 'Admin';

  const menuItems = [
    { id: 'dashboard', label: 'Home', icon: '🏠' },
    { id: 'categories', label: 'Categories', icon: '📂' },
  ];

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('userRole');
    localStorage.removeItem('userId');
    navigate('/admin-login');
  };

  return (
    <>
      <aside className="w-72 bg-[#0B1120] text-slate-300 min-h-screen fixed left-0 top-0 flex flex-col shadow-2xl z-40">
        
        <div className="p-8 pb-10">
          <h1 className="text-2xl font-black text-white tracking-tight">FCI ADMIN</h1>
          <p className="text-xs font-bold text-slate-500 tracking-widest uppercase mt-1">Smart Attendance</p>
        </div>

        <nav className="flex-1 px-4 space-y-2">
          {menuItems.map((item) => (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`w-full flex items-center gap-4 px-6 py-4 rounded-xl font-bold transition-all ${
                activeTab === item.id 
                  ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/30' 
                  : 'hover:bg-slate-800 hover:text-white'
              }`}
            >
              <span className="text-xl">{item.icon}</span>
              {item.label}
            </button>
          ))}
        </nav>

        {/* BOTTOM SECTION: Profile & Logout */}
        <div className="mt-auto p-4 border-t border-slate-800/50 space-y-2">
          
          {/* New Profile Button */}
          <button 
            onClick={() => setActiveTab('profile')}
            className={`w-full flex items-center gap-3 p-3 rounded-xl transition-all ${
              activeTab === 'profile' ? 'bg-slate-800 text-white' : 'hover:bg-slate-800/50'
            }`}
          >
            <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-blue-500 to-indigo-500 flex items-center justify-center text-white font-bold text-lg shadow-md">
              {adminId.charAt(0).toUpperCase()}
            </div>
            <div className="text-left flex-1 overflow-hidden">
              <p className="text-sm font-bold text-slate-200 truncate">My Profile</p>
              <p className="text-xs text-slate-500 font-medium truncate">{adminId}</p>
            </div>
          </button>

          {/* Sign Out Button */}
          <button 
            onClick={() => setShowLogoutModal(true)}
            className="w-full flex items-center gap-4 px-6 py-3.5 rounded-xl font-bold text-red-400 hover:bg-red-500/10 hover:text-red-300 transition-all"
          >
            <span className="text-xl">🚪</span>
            Sign Out
          </button>
        </div>
      </aside>

      {/* Logout Modal */}
      {showLogoutModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm animate-fade-in">
          <div className="bg-white p-8 rounded-[2rem] shadow-2xl max-w-sm w-full mx-4 text-center">
            <div className="w-20 h-20 bg-red-50 text-red-500 rounded-full flex items-center justify-center text-4xl mx-auto mb-6">⚠️</div>
            <h3 className="text-2xl font-black text-slate-900 mb-2 tracking-tight">Sign Out?</h3>
            <p className="text-slate-500 font-medium mb-8">Are you sure you want to securely log out?</p>
            <div className="flex gap-4">
              <button onClick={() => setShowLogoutModal(false)} className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold py-3.5 rounded-xl transition-all">Cancel</button>
              <button onClick={handleLogout} className="flex-1 bg-red-500 hover:bg-red-600 text-white font-bold py-3.5 rounded-xl transition-all shadow-lg hover:shadow-red-500/30 active:scale-95">Yes, Sign Out</button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default Sidebar;