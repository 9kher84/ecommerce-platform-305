import React from 'react';

export const BottomStatus = ({ activeDomain, systemStatus }) => {
  return (
    <footer className="fixed bottom-0 left-0 right-0 z-40 bg-slate-900 text-slate-300 text-xs px-6 py-2 flex justify-between items-center border-t border-slate-800 shadow-2xl backdrop-blur-md">
      <div className="flex items-center gap-4">
        <span className="flex items-center gap-2 text-emerald-400 font-bold">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
          {systemStatus?.statusText || 'Procurement OS Active'}
        </span>
        <span className="text-slate-700">|</span>
        <span className="text-slate-300">
          المفاوضات النشطة: <strong className="text-amber-400">{systemStatus?.activeNegotiationsCount || 0}</strong>
        </span>
        <span className="text-slate-700">|</span>
        <span className="text-slate-300">
          الترسيات المحسومة: <strong className="text-emerald-400">{systemStatus?.awardedCount || 0}</strong>
        </span>
        <span className="text-slate-700">|</span>
        <span className="text-slate-400">
          عدسة العرض: <strong className="text-indigo-400">{activeDomain}</strong>
        </span>
      </div>

      <div className="flex items-center gap-4 text-slate-400">
        <span className="bg-slate-800 px-2 py-0.5 rounded text-[11px] font-mono text-slate-300 border border-slate-700">Ctrl + K للبحث</span>
        <span className="text-emerald-400 text-[11px] font-bold">● AI Ready</span>
      </div>
    </footer>
  );
};
