const CategoryGrid = ({ onSelect }) => {
  const categories = [
    { id: 'CLASS', label: 'Classes', icon: '📚', color: 'bg-blue-600', desc: 'Academic Sessions' },
    { id: 'TECH_FEST', label: 'Tech Fest', icon: '🛠️', color: 'bg-purple-600', desc: 'Competitions & Events' },
    { id: 'OUTBOUND', label: 'Outbound', icon: '🚀', color: 'bg-orange-500', desc: 'Industrial Visits' },
    { id: 'EXTRA_CURRICULAR', label: 'Extra Curricular', icon: '🎨', color: 'bg-pink-600', desc: 'Cultural activities and volunteering' },
    { id: 'ONLINE_CLASS', label: 'Online Classes', icon: '🌐', color: 'bg-teal-500',desc: 'VIRTUAL SESSIONS' }
  ];

  return (
    <div className="animate-fade-in">
      <div className="mb-14">
        {/* Bold heading with tight tracking */}
        <h1 className="text-5xl font-black text-slate-900 tracking-tighter">
          List of categories
        </h1>
        <p className="text-slate-500 font-medium mt-3 text-xl tracking-wide">
          Select a category to manage attendance records.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
        {categories.map((cat) => (
          <div 
            key={cat.id} 
            onClick={() => onSelect(cat)}
            // 'items-center' aligns the icon box and text box center-to-center
            className="group bg-white p-10 rounded-[2.5rem] shadow-[0_4px_20px_rgba(0,0,0,0.03)] border border-slate-100 hover:shadow-2xl hover:border-blue-200 transition-all cursor-pointer flex items-center gap-8"
          >
            {/* Perfectly centered icon box */}
            <div className={`w-24 h-24 shrink-0 rounded-3xl ${cat.color} flex items-center justify-center text-4xl shadow-lg group-hover:scale-105 transition-transform`}>
              {cat.icon}
            </div>
            
            {/* Text container with tracking-wide for professional letter spacing */}
            <div className="flex flex-col justify-center">
              <h2 className="text-3xl font-bold text-slate-800 tracking-tight leading-none">
                {cat.label}
              </h2>
              <p className="text-slate-400 font-semibold text-sm mt-2 tracking-[0.1em] uppercase">
                {cat.desc}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default CategoryGrid;