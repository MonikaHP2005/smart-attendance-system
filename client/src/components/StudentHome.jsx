import React from 'react';

const StudentHome = ({ stats, history, onStartScan }) => {
  return (
    <div className="animate-fade-in">
      {/* Professional Scanner Action Card - Matched to Main Page Green */}
      <div className="bg-gradient-to-br from-green-600 to-green-800 rounded-[2.5rem] p-10 sm:p-12 text-center shadow-[0_8px_30px_rgb(22,163,74,0.2)] mb-8 relative overflow-hidden group">
        <div className="absolute -top-24 -right-24 w-64 h-64 bg-white opacity-10 rounded-full blur-2xl group-hover:scale-110 transition-transform duration-700"></div>
        <div className="absolute -bottom-24 -left-24 w-64 h-64 bg-white opacity-10 rounded-full blur-2xl group-hover:scale-110 transition-transform duration-700"></div>
        
        <h2 className="text-3xl sm:text-4xl font-black text-white mb-3 relative z-10 tracking-tight">Ready for class?</h2>
        <p className="text-green-100 mb-8 relative z-10 font-medium">Make sure you are within 50 meters of the classroom.</p>
        
        <button 
          onClick={onStartScan}
          className="bg-white text-green-700 hover:text-green-800 hover:bg-slate-50 font-black text-xl px-8 sm:px-12 py-5 rounded-2xl shadow-xl hover:shadow-2xl transition-all active:scale-95 relative z-10 flex items-center justify-center gap-3 mx-auto w-full sm:w-auto"
        >
          <span className="text-2xl">📷</span> 
          Scan QR Code
        </button>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mb-6">
        <div className="bg-white shadow-sm rounded-[2rem] p-8 flex flex-col items-center justify-center border border-slate-100 hover:shadow-md transition-shadow">
          <h3 className="text-slate-400 font-bold text-xs uppercase tracking-widest mb-4">Overall Compliance</h3>
          <div className="relative flex items-center justify-center">
            <svg className="w-36 h-36 transform -rotate-90">
              <circle cx="72" cy="72" r="60" stroke="currentColor" strokeWidth="12" fill="transparent" className="text-slate-100" />
              <circle 
                cx="72" cy="72" r="60" 
                stroke="currentColor" strokeWidth="12" fill="transparent" 
                strokeDasharray="377" 
                strokeDashoffset={377 - (377 * stats.percentage) / 100} 
                strokeLinecap="round"
                className="text-green-500 transition-all duration-1000 ease-out" 
              />
            </svg>
            <div className="absolute flex flex-col items-center">
              <span className="text-4xl font-black text-slate-800 tracking-tighter">{stats.percentage}%</span>
            </div>
          </div>
        </div>

        <div className="bg-white shadow-sm rounded-[2rem] p-8 flex flex-col justify-center border border-slate-100 hover:shadow-md transition-shadow">
          <h3 className="text-slate-400 font-bold text-xs uppercase tracking-widest mb-6">Activity Record</h3>
          <div className="space-y-5">
            <div>
              <p className="text-xs text-slate-500 font-semibold mb-1 uppercase">Total Attended</p>
              <p className="text-4xl font-black text-green-600 tracking-tighter">
                {stats.attended} <span className="text-lg text-slate-400 font-medium tracking-normal">/ {stats.total} Sessions</span>
              </p>
            </div>
            <div className="w-full bg-slate-100 rounded-full h-3 overflow-hidden">
              <div 
                className="bg-green-500 h-full rounded-full transition-all duration-1000" 
                style={{ width: `${stats.percentage}%` }}
              ></div>
            </div>
          </div>
        </div>
      </div>

      {/* History Table */}
      <div className="bg-white shadow-sm rounded-[2.5rem] p-8 border border-slate-100">
        <h3 className="text-2xl font-black text-slate-800 mb-6 tracking-tight">Recent Check-ins</h3>
        {history.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-100 text-xs font-bold text-slate-400 uppercase tracking-widest">
                  <th className="py-4 px-2">Session Title</th>
                  <th className="py-4 px-2">Category</th>
                  <th className="py-4 px-2">Timestamp</th>
                  <th className="py-4 px-2 text-right">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {history.map((item, index) => (
                  <tr key={index} className="hover:bg-slate-50 transition duration-150">
                    <td className="py-4 px-2 font-semibold text-slate-800">{item.title}</td>
                    <td className="py-4 px-2">
                      <span className="bg-blue-50 text-blue-600 px-3 py-1 rounded-md text-xs font-bold uppercase tracking-wider">{item.activity_type}</span>
                    </td>
                    <td className="py-4 px-2 text-sm text-slate-500 font-medium">
                      {new Date(item.check_in_time).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' })}
                    </td>
                    <td className="py-4 px-2 text-right">
                      <span className="bg-green-50 text-green-700 border border-green-200 text-xs font-bold uppercase tracking-wider px-3 py-1.5 rounded-full">
                        {item.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="text-center py-12 text-slate-400">
            <p className="text-5xl mb-4 opacity-50">📭</p>
            <p className="font-medium text-lg text-slate-500">You haven't checked into any events yet.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default StudentHome;