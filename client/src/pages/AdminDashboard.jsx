import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import toast, { Toaster } from "react-hot-toast";
import Sidebar from "../components/Sidebar";
import CategoryGrid from "../components/CategoryGrid";
import BatchGrid from "../components/BatchGrid";
import EventList from "../components/EventList";
import EventDetail from "../components/EventDetail";
import AdminProfile from "../components/AdminProfile";
import OrganiserProfile from "../components/OrganiserProfile";

// ====================================================
// THE FORM: Add Organiser Component
// ====================================================
const AddOrganiserForm = () => {
  const [formData, setFormData] = useState({ id: '', name: '', email: '', password: '' });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const token = localStorage.getItem('adminToken');
      const response = await fetch('http://localhost:5000/api/auth/register-organiser', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}` 
        },
        body: JSON.stringify({
          organiserId: formData.id,
          name: formData.name,
          email: formData.email,
          password: formData.password
        }),
      });
      const data = await response.json();
      if (response.ok) {
        toast.success("Organiser Registered Successfully!");
        setFormData({ id: '', name: '', email: '', password: '' });
      } else {
        toast.error(data.message || "Registration failed");
      }
    } catch (error) {
      toast.error("Connection error to server.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto bg-white p-10 rounded-[2.5rem] shadow-sm border border-slate-100 animate-fade-in">
      <div className="mb-8">
        <h2 className="text-3xl font-black text-slate-900 tracking-tight">Register Organiser</h2>
        <p className="text-slate-500 font-medium">Create login credentials for new staff members.</p>
      </div>
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">Organiser ID</label>
            <input type="text" required placeholder="e.g. ORG-001" className="w-full px-5 py-4 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-purple-500 outline-none transition-all font-semibold" value={formData.id} onChange={(e) => setFormData({...formData, id: e.target.value})} />
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">Full Name</label>
            <input type="text" required placeholder="Enter Name" className="w-full px-5 py-4 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-purple-500 outline-none transition-all font-semibold" value={formData.name} onChange={(e) => setFormData({...formData, name: e.target.value})} />
          </div>
        </div>
        <div>
          <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">Email Address</label>
          <input type="email" required placeholder="email@fci-india.org" className="w-full px-5 py-4 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-purple-500 outline-none transition-all font-semibold" value={formData.email} onChange={(e) => setFormData({...formData, email: e.target.value})} />
        </div>
        <div>
          <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">Temporary Password</label>
          <input type="password" required placeholder="••••••••" className="w-full px-5 py-4 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-purple-500 outline-none transition-all font-semibold" value={formData.password} onChange={(e) => setFormData({...formData, password: e.target.value})} />
        </div>
        <button disabled={isSubmitting} className="w-full bg-purple-600 hover:bg-purple-700 text-white font-black py-4 rounded-2xl shadow-xl transition-all disabled:opacity-50">
          {isSubmitting ? "Registering..." : "Create Organiser Account"}
        </button>
      </form>
    </div>
  );
};

// ====================================================
// MAIN DASHBOARD
// ====================================================
function AdminDashboard() {
  const navigate = useNavigate();

  useEffect(() => {
    const token = localStorage.getItem('adminToken');
    if (!token) navigate('/admin-login'); 
  }, [navigate]);

  const [events, setEvents] = useState([]);
  const [activeTab, setActiveTab] = useState(() => localStorage.getItem('adminActiveTab') || 'dashboard');
  const [view, setView] = useState(() => {
    const savedView = localStorage.getItem('adminView');
    return savedView ? JSON.parse(savedView) : { level: 'categories', category: null, batch: null, selectedEvent: null };
  });

  useEffect(() => { localStorage.setItem('adminActiveTab', activeTab); }, [activeTab]);
  useEffect(() => { localStorage.setItem('adminView', JSON.stringify(view)); }, [view]);

  const handleSidebarNavigate = (tabId) => {
    setActiveTab(tabId);
    setView({ level: 'categories', category: null, batch: null, selectedEvent: null });
  };

  const fetchEvents = useCallback(() => {
    const token = localStorage.getItem('adminToken');
    fetch("http://localhost:5000/api/events", {
      headers: { 'Authorization': `Bearer ${token}` }
    })
      .then(res => res.json())
      .then(data => setEvents(Array.isArray(data) ? data : []))
      .catch(err => console.error("Fetch Error:", err));
  }, []);

  useEffect(() => { fetchEvents(); }, [fetchEvents]);

  const renderContent = () => {
    if (activeTab === 'profile') {
      const userRole = (localStorage.getItem('userRole') || 'admin').toLowerCase();
      return userRole === 'admin' ? <AdminProfile /> : <OrganiserProfile />;
    }
    
    if (activeTab === 'add-organiser') return <AddOrganiserForm />;

    const level = view?.level || 'categories';
    switch (level) {
      case 'categories': 
        return <CategoryGrid onSelect={(cat) => setView({...view, level: 'batches', category: cat})} />;
      
      case 'batches': 
        return <BatchGrid category={view.category} onBack={() => setView({...view, level: 'categories'})} onSelect={(b) => setView({...view, level: 'events', batch: b})} />;
      
      case 'events': 
        // 🔥 SAFETY GUARD: Ensure filtering doesn't crash on null properties
        const filtered = events.filter(e => {
          if (!e || !view.category || !view.batch) return false;
          const dbActivity = String(e.activity_type || "").toUpperCase().trim();
          const viewCategory = String(view.category?.id || "").toUpperCase().trim();
          const dbBatch = String(e.batch || "").toUpperCase().trim();
          const viewBatch = String(view.batch || "").toUpperCase().trim();
          return dbActivity === viewCategory && dbBatch === viewBatch;
        });
        return <EventList events={filtered} category={view.category} batch={view.batch} onBack={() => setView({...view, level: 'batches'})} onSelect={(e) => setView({...view, level: 'detail', selectedEvent: e})} />;
      
      case 'detail': 
        // 🔥 SAFETY GUARD: Match event from fresh list or use selected
        const freshEventData = events.find(e => e.id === view.selectedEvent?.id) || view.selectedEvent;
        if (!freshEventData) return <div className="text-center p-10 font-bold">Event data not found.</div>;
        return <EventDetail event={freshEventData} onBack={() => { fetchEvents(); setView({...view, level: 'events'}); }} onUpdate={fetchEvents} />;
      
      default: 
        return <CategoryGrid onSelect={(cat) => setView({...view, level: 'batches', category: cat})} />;
    }
  };

  return (
    <div className="h-screen w-full bg-slate-50 flex overflow-hidden font-sans">
      <Toaster position="top-center" />
      <Sidebar activeTab={activeTab} setActiveTab={handleSidebarNavigate} />
      <main className="flex-1 ml-72 h-full overflow-y-auto relative bg-slate-50">
        <div className="w-full py-12 px-12 xl:px-20 pb-24">
          {renderContent()}
        </div>
      </main>
    </div>
  );
}

export default AdminDashboard;