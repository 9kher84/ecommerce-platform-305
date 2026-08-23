import React from 'react';

export const WorkspaceHeader = ({ project, activeDomain, onDomainChange, viewMode, onViewModeChange, systemStatus }) => {
  const domains = [
    { id: 'Overview', label: '📊 Dashboard' },
    { id: 'Work', label: '🧱 Procurement' },
    { id: 'Financial', label: '💰 Finance' },
    { id: 'Documents', label: '📁 Files' },
    { id: 'Intelligence', label: '🤖 AI Copilot' }
  ];

  const health = systemStatus?.healthPercent ?? 91;
  const progress = systemStatus?.progressPercent ?? 42;
  const risk = systemStatus?.riskLevel ?? 'Low';
  const budget = systemStatus?.budgetPercent ?? 95;

  return (
    <header className="sticky top-0 z-40 bg-slate-900/95 backdrop-blur border-b border-slate-800 text-white shadow-md">
      <div className="max-w-[1600px] mx-auto px-6 py-3 flex flex-wrap justify-between items-center gap-4">
        
        {/* Deal Context Title & View Mode Selector */}
        <div className="flex items-center gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 px-2 py-0.5 rounded font-mono">
                Deal Workspace Engine
              </span>
              <h1 className="text-lg font-black text-white tracking-tight">
                {project?.header?.title || project?.title || 'صفقة التوريد والشراء'}
              </h1>
            </div>
            
            {/* View Mode Selector (User Rule: Professional vs Simple Mode) */}
            <div className="flex items-center gap-2 mt-1">
              <span className="text-[11px] text-slate-400 font-bold">واجهة الاستخدام:</span>
              <div className="flex gap-1 bg-slate-800/90 p-0.5 rounded-lg border border-slate-700">
                <button
                  onClick={() => onViewModeChange && onViewModeChange('PROFESSIONAL')}
                  className={`px-2.5 py-0.5 rounded text-[11px] font-bold transition ${
                    viewMode === 'PROFESSIONAL' 
                      ? 'bg-indigo-600 text-white shadow-sm' 
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  🏢 احترافية (Professional)
                </button>
                <button
                  onClick={() => onViewModeChange && onViewModeChange('SIMPLE')}
                  className={`px-2.5 py-0.5 rounded text-[11px] font-bold transition ${
                    viewMode === 'SIMPLE' 
                      ? 'bg-indigo-600 text-white shadow-sm' 
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  👤 بسيطة (Simple)
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* DYNAMIC DEAL PULSE INDICATOR (Only in Professional Mode) */}
        {viewMode === 'PROFESSIONAL' && (
          <div className="hidden lg:flex items-center gap-3 bg-slate-800/90 border border-slate-700/80 px-4 py-1.5 rounded-xl shadow-inner">
            <div className="flex items-center gap-2 border-r border-slate-700 pr-3">
              <span className={`w-3 h-3 rounded-full animate-pulse ${
                health >= 80 ? 'bg-emerald-400' : health >= 50 ? 'bg-amber-400' : 'bg-red-500'
              }`}></span>
              <span className="text-xs font-bold text-slate-300">Deal Health</span>
              <span className="text-sm font-black text-emerald-400">{health}%</span>
            </div>

            <div className="flex items-center gap-3 text-xs text-slate-300">
              <span>Budget: <strong className="text-white">{budget}%</strong></span>
              <span>Progress: <strong className="text-white">{progress}%</strong></span>
              <span>Risk: <strong className={risk === 'Low' ? 'text-emerald-400' : 'text-amber-400'}>{risk}</strong></span>
            </div>
          </div>
        )}

        {/* Domain Perspectives Bar (Only in Professional Mode) */}
        {viewMode === 'PROFESSIONAL' && (
          <nav className="flex gap-1 overflow-x-auto bg-slate-800/80 p-1 rounded-lg border border-slate-700">
            {domains.map((dom) => (
              <button
                key={dom.id}
                onClick={() => onDomainChange && onDomainChange(dom.id)}
                className={`px-3 py-1.5 rounded-md text-xs font-bold transition whitespace-nowrap ${
                  activeDomain === dom.id
                    ? 'bg-indigo-600 text-white shadow-sm'
                    : 'text-slate-300 hover:text-white hover:bg-slate-700/60'
                }`}
              >
                {dom.label}
              </button>
            ))}
          </nav>
        )}
      </div>
    </header>
  );
};
