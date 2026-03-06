import React from 'react';

const BatchGrid = ({ category, onBack, onSelect }) => {
  // Mapping the clean UI names to your exact database values
  const batches = [
    { id: 'B4', label: 'Batch 4' },
    { id: 'B5', label: 'Batch 5' },
    { id: 'B6', label: 'Batch 6' }
  ];

  return (
    <div className="animate-fade-in max-w-5xl mx-auto">
      <div className="mb-10">
        <button 
        onClick={onBack}
        className="bg-slate-100 hover:bg-blue-50 text-slate-600 hover:text-blue-700 px-4 py-2.5 rounded-xl font-bold text-xs uppercase tracking-wider transition-all flex items-center gap-2 mb-6 shadow-sm active:scale-95 w-fit border border-slate-200"
        >
           Back
        </button>
        <h1 className="text-4xl font-black text-slate-900 tracking-tight">
          {category?.label} Batches
        </h1>
        <p className="text-slate-500 font-medium mt-2 tracking-wide text-lg">
          Select a batch to view scheduled {category?.label?.toLowerCase()}.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
        {batches.map((batch) => (
          <div 
            key={batch.id} 
            // We pass batch.id (e.g., "B4") back to the Dashboard so it filters correctly!
            onClick={() => onSelect(batch.id)}
            className="group bg-white p-8 rounded-3xl shadow-sm border border-slate-100 hover:shadow-xl hover:border-blue-200 transition-all cursor-pointer flex flex-col items-center justify-center text-center gap-4"
          >
            <div className={`w-20 h-20 rounded-2xl ${category?.color || 'bg-blue-600'} flex items-center justify-center text-3xl shadow-md group-hover:scale-110 transition-transform`}>
              🎓
            </div>
            <div>
              <h2 className="text-2xl font-bold text-slate-800 tracking-tight">
                {batch.label}
              </h2>
              <p className="text-slate-400 font-semibold text-sm mt-1">
                ID: {batch.id}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default BatchGrid;