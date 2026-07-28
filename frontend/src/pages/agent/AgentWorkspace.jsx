import React, { useState } from 'react';
import { Button } from '../../components/common/Button';

export const AgentWorkspace = () => {
  const [activeAgent, setActiveAgent] = useState({
    name: 'Commercial Procurement Agent',
    role: 'Procurement Specialist',
    status: 'WORKING', // 'WORKING' | 'IDLE' | 'PENDING_APPROVAL'
    confidenceScore: 94,
    currentGoal: 'Find and negotiate top steel suppliers for Riyadh Project',
    currentStep: 'Step 3/5: Negotiating 5% Discount with Saudi Steel Co',
    toolsCount: 12,
    pendingApprovalsCount: 1,
    memoryHighlights: [
      'User Preference: Always negotiate minimum 5%',
      'Org Policy: Blocked Corp is strictly prohibited',
      'Scope: Project A - Riyadh'
    ],
    recentDecisions: [
      { id: 1, title: 'Search Market Suppliers', result: 'Found 4 Verified Suppliers', time: '10:15 AM' },
      { id: 2, title: 'Create RFQ #804', result: 'Draft Created & Validated', time: '10:30 AM' },
      { id: 3, title: 'Pre-Execution Risk Audit', result: 'Passed - No Collusion Detected', time: '10:45 AM' }
    ]
  });

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans p-6">
      <div className="max-w-[1600px] mx-auto space-y-6">
        
        {/* Agent Workspace Header */}
        <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl shadow-xl flex flex-wrap justify-between items-center gap-6">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-indigo-600 flex items-center justify-center font-black text-2xl shadow-lg shadow-indigo-500/20">
              🤖
            </div>
            <div>
              <div className="flex items-center gap-3">
                <h1 className="text-xl font-black text-white">{activeAgent.name}</h1>
                <span className="bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-xs px-3 py-0.5 rounded-full font-mono font-bold flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                  {activeAgent.status}
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-1">الموظف الرقمي المتخصص في إدارات المشتريات والتفاوض التجاري.</p>
            </div>
          </div>

          {/* Metric Badges */}
          <div className="flex items-center gap-4 text-xs">
            <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 text-center">
              <span className="text-slate-400 font-bold block text-[10px]">مستوى الثقة (Confidence)</span>
              <strong className="text-emerald-400 text-base font-black">{activeAgent.confidenceScore}%</strong>
            </div>
            <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 text-center">
              <span className="text-slate-400 font-bold block text-[10px]">الموافقات المعلقة</span>
              <strong className="text-amber-400 text-base font-black">{activeAgent.pendingApprovalsCount}</strong>
            </div>
            <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 text-center">
              <span className="text-slate-400 font-bold block text-[10px]">الأدوات المسندة</span>
              <strong className="text-indigo-400 text-base font-black">{activeAgent.toolsCount}</strong>
            </div>
          </div>
        </div>

        {/* Current Execution State Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* Active Goal & Step Card */}
          <div className="lg:col-span-2 bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4 shadow-xl">
            <h2 className="text-sm font-bold text-slate-300">الهدف الجاري وسير العمل التشغيلي (Current Workflow)</h2>
            
            <div className="bg-indigo-950/40 border border-indigo-500/30 p-4 rounded-xl space-y-2">
              <span className="text-[10px] font-mono font-bold text-indigo-400 bg-indigo-500/20 px-2 py-0.5 rounded">
                Active Goal
              </span>
              <h3 className="text-base font-bold text-white">{activeAgent.currentGoal}</h3>
              <p className="text-xs text-indigo-300 font-mono mt-1">🔄 {activeAgent.currentStep}</p>
            </div>

            <div className="space-y-3">
              <h3 className="text-xs font-bold text-slate-300">سجل القرارات الأخيرة (Recent Agent Decisions)</h3>
              <div className="space-y-2">
                {activeAgent.recentDecisions.map(d => (
                  <div key={d.id} className="bg-slate-950 p-3 rounded-xl border border-slate-800/80 flex justify-between items-center text-xs">
                    <div>
                      <strong className="text-white block font-bold">{d.title}</strong>
                      <span className="text-slate-400 text-[11px]">{d.result}</span>
                    </div>
                    <span className="text-slate-500 font-mono text-[10px]">{d.time}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Persistent Memory Highlights Card */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4 shadow-xl">
            <h2 className="text-sm font-bold text-slate-300">الذاكرة المعرفية الدائمة (Persistent Knowledge)</h2>
            
            <div className="space-y-2.5">
              {activeAgent.memoryHighlights.map((m, idx) => (
                <div key={idx} className="bg-slate-950 p-3 rounded-xl border border-slate-800/80 text-xs text-slate-300 flex items-start gap-2">
                  <span className="text-amber-400 mt-0.5">🧠</span>
                  <span>{m}</span>
                </div>
              ))}
            </div>

            <Button className="w-full bg-slate-800 hover:bg-slate-700 text-xs font-bold py-2.5 rounded-xl border border-slate-700">
              إدارة الذاكرة الدائمة ⚙️
            </Button>
          </div>

        </div>

      </div>
    </div>
  );
};
