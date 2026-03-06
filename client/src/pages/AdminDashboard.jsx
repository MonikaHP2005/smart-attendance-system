import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import Sidebar from "../components/Sidebar";
import CategoryGrid from "../components/CategoryGrid";
import BatchGrid from "../components/BatchGrid";
import EventList from "../components/EventList";
import EventDetail from "../components/EventDetail";
import AdminProfile from "../components/AdminProfile";

function AdminDashboard() {
  const navigate = useNavigate();

  // 🔥 THE FRONTEND BOUNCER - Looks for adminToken
  useEffect(() => {
    const token = localStorage.getItem('adminToken');
    if (!token) {
      navigate('/admin-login'); 
    }
  }, [navigate]);

  const [events, setEvents] = useState([]);
  const [activeTab, setActiveTab] = useState("dashboard");
  const [view, setView] = useState({ 
    level: 'categories', 
    category: null, 
    batch: null, 
    selectedEvent: null 
  });

  const handleSidebarNavigate = (tabId) => {
    setActiveTab(tabId);
    setView({ level: 'categories', category: null, batch: null, selectedEvent: null });
  };

  const fetchEvents = useCallback(() => {
    const token = localStorage.getItem('adminToken'); // 🔥 Use adminToken
    
    fetch("http://localhost:5000/api/events", {
      headers: { 'Authorization': `Bearer ${token}` }
    })
      .then(res => res.json())
      .then(data => setEvents(data))
      .catch(err => console.error("Fetch Error:", err));
  }, []);

  useEffect(() => {
    fetchEvents();
  }, [fetchEvents]);

  const renderContent = () => {
    if (activeTab === 'profile') {
      return <AdminProfile />;
    }

    const level = view?.level || 'categories';
    switch (level) {
      case 'categories': 
        return <CategoryGrid onSelect={(cat) => setView({...view, level: 'batches', category: cat})} />;
      
      case 'batches': 
        return <BatchGrid category={view.category} onBack={() => setView({...view, level: 'categories'})} onSelect={(b) => setView({...view, level: 'events', batch: b})} />;
      
      case 'events': 
        const filtered = events.filter(e => {
          const dbActivity = String(e.activity_type || "").toUpperCase().trim();
          const viewCategory = String(view.category?.id || "").toUpperCase().trim();
          const dbBatch = String(e.batch || "").toUpperCase().trim();
          const viewBatch = String(view.batch || "").toUpperCase().trim();
          return dbActivity === viewCategory && dbBatch === viewBatch;
        });

        return <EventList events={filtered} category={view.category} batch={view.batch} onBack={() => setView({...view, level: 'batches'})} onSelect={(e) => setView({...view, level: 'detail', selectedEvent: e})} />;
      
      case 'detail': 
        const freshEventData = events.find(e => e.id === view.selectedEvent?.id) || view.selectedEvent;
        return <EventDetail event={freshEventData} onBack={() => { fetchEvents(); setView({...view, level: 'events'}); }} onUpdate={fetchEvents} />;
      
      default: 
        return <CategoryGrid onSelect={(cat) => setView({...view, level: 'batches', category: cat})} />;
    }
  };

  return (
    <div className="flex min-h-screen w-full bg-white">
      <Sidebar activeTab={activeTab} setActiveTab={handleSidebarNavigate} />
      <main className="flex-1 ml-72 bg-white min-h-screen">
        <div className="w-full py-16 px-12 xl:px-20">
          {renderContent()}
        </div>
      </main>
    </div>
  );
}

export default AdminDashboard;