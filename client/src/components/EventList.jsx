import React, { useState } from 'react';

const EventList = ({ events, category, batch, onBack, onSelect }) => {
  // Add state to track sorting order ('desc' = newest first, 'asc' = oldest first)
  const [sortOrder, setSortOrder] = useState('desc');

  // Create a sorted copy of the events array
  const sortedEvents = [...events].sort((a, b) => {
    const timeA = new Date(a.start_time).getTime();
    const timeB = new Date(b.start_time).getTime();
    
    return sortOrder === 'desc' ? timeB - timeA : timeA - timeB;
  });

  return (
    <div className="animate-fade-in max-w-5xl mx-auto">
      
      {/* Header Section with Flexbox to align Title (Left) and Sort Dropdown (Right) */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between mb-10 gap-4">
        <div>
          <button 
            onClick={onBack}
            className="bg-slate-100 hover:bg-blue-50 text-slate-600 hover:text-blue-700 px-4 py-2.5 rounded-xl font-bold text-xs uppercase tracking-wider transition-all flex items-center gap-2 mb-4 shadow-sm active:scale-95 w-fit border border-slate-200"
          > Back
          </button>
          <h1 className="text-4xl font-black text-slate-900 tracking-tight">
            {category?.label} - Batch {batch}
          </h1>
          <p className="text-slate-500 font-medium mt-2 tracking-wide text-lg">
            Select a session to manage attendance.
          </p>
        </div>

        {/* Sort Dropdown (Only show if there are events to sort) */}
        {events.length > 0 && (
          <div className="flex items-center gap-3 bg-white border border-slate-200 px-5 py-3 rounded-xl shadow-sm">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">
              Sort By
            </span>
            <select
              value={sortOrder}
              onChange={(e) => setSortOrder(e.target.value)}
              className="bg-transparent text-slate-800 font-bold text-sm focus:outline-none cursor-pointer"
            >
              <option value="desc">Date: Newest First</option>
              <option value="asc">Date: Oldest First</option>
            </select>
          </div>
        )}
      </div>

      {/* Empty State or Event List */}
      {sortedEvents.length === 0 ? (
        <div className="bg-slate-50 border-2 border-dashed border-slate-200 rounded-3xl p-16 text-center">
          <div className="text-5xl mb-4">📭</div>
          <h3 className="text-xl font-bold text-slate-700">No events scheduled</h3>
          <p className="text-slate-500 mt-2">There are no {category?.label?.toLowerCase()} planned for Batch {batch} yet.</p>
        </div>
      ) : (
        <div className="flex flex-col gap-4">
          {sortedEvents.map((event) => (
            <div 
              key={event.id}
              onClick={() => onSelect(event)}
              className="group bg-white p-6 rounded-2xl shadow-sm border border-slate-100 hover:shadow-lg hover:border-blue-200 transition-all cursor-pointer flex flex-col sm:flex-row sm:items-center justify-between gap-4"
            >
              <div>
                <h3 className="text-xl font-bold text-slate-800 tracking-tight mb-1">{event.title}</h3>
                <p className="text-slate-500 text-sm font-medium">
                  Instructor: {event.instructor_name || 'N/A'} • Date: {new Date(event.start_time).toLocaleDateString()}
                </p>
              </div>
              <div className="flex items-center gap-4 self-start sm:self-auto">
                {event.is_active && (
                  <span className="bg-green-100 text-green-700 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider animate-pulse">
                    Live
                  </span>
                )}
                <button className="bg-slate-100 group-hover:bg-blue-600 group-hover:text-white text-slate-600 font-bold px-5 py-2.5 rounded-xl transition-colors text-sm">
                  Manage
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default EventList;