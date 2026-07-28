import React, { useState } from 'react';
import { Button } from '../../components/common/Button';

export const EnterpriseKnowledgeGraph = () => {
  const [graphData, setGraphData] = useState({
    orgName: 'شركة الإعمار الذهبي للمقاولات',
    totalNodes: 14,
    totalEdges: 22,
    nodes: [
      { id: 'org-1', label: 'شركة الإعمار الذهبي', type: 'ORGANIZATION', color: 'bg-indigo-600' },
      { id: 'proj-1', label: 'مشروع الرياض الإستراتيجي', type: 'PROJECT', color: 'bg-emerald-600' },
      { id: 'rfq-804', label: 'طلب شراء حديد #804', type: 'RFQS', color: 'bg-purple-600' },
      { id: 'supp-101', label: 'شركة الصلب الوطنية', type: 'SUPPLIER', color: 'bg-amber-600' },
      { id: 'agent-1', label: 'Commercial Procurement Agent', type: 'AGENT', color: 'bg-indigo-500' }
    ],
    edges: [
      { from: 'شركة الإعمار الذهبي', to: 'مشروع الرياض الإستراتيجي', relation: 'OWNER_OF' },
      { from: 'مشروع الرياض الإستراتيجي', to: 'طلب شراء حديد #804', relation: 'CONTAINS_RFQ' },
      { from: 'Commercial Procurement Agent', to: 'طلب شراء حديد #804', relation: 'MANAGED_BY_AGENT' },
      { from: 'طلب شراء حديد #804', to: 'شركة الصلب الوطنية', relation: 'AWARDED_TO' }
    ]
  });

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans p-6">
      <div className="max-w-[1600px] mx-auto space-y-6">
        
        {/* Header */}
        <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl shadow-xl flex flex-wrap justify-between items-center gap-6">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-indigo-600 flex items-center justify-center font-black text-2xl shadow-lg shadow-indigo-500/20">
              🕸️
            </div>
            <div>
              <div className="flex items-center gap-3">
                <h1 className="text-xl font-black text-white">العقل المعرفي للمؤسسة (Enterprise Business Knowledge Graph)</h1>
                <span className="bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-xs px-3 py-0.5 rounded-full font-mono font-bold">
                  Real-Time Relational Graph
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-1">عرض وتتبع العلاقات الديناميكية الحية بين المشاريع، الصفقات، الموردين، والوكلاء الذكيين.</p>
            </div>
          </div>

          <div className="flex gap-3 text-xs">
            <div className="bg-slate-950 px-4 py-2 rounded-xl border border-slate-800 text-center">
              <span className="text-slate-400 font-bold block text-[10px]">العقد المعرفية (Nodes)</span>
              <strong className="text-indigo-400 text-sm font-black">{graphData.totalNodes}</strong>
            </div>
            <div className="bg-slate-950 px-4 py-2 rounded-xl border border-slate-800 text-center">
              <span className="text-slate-400 font-bold block text-[10px]">العلاقات (Edges)</span>
              <strong className="text-emerald-400 text-sm font-black">{graphData.totalEdges}</strong>
            </div>
          </div>
        </div>

        {/* Visual Graph View */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-6">
          <h2 className="text-sm font-bold text-slate-300">خارطة التفاعل الشبكي المباشر (Dynamic Visual Nodes)</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4">
            {graphData.nodes.map(n => (
              <div key={n.id} className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-2 text-center shadow-md hover:border-indigo-500 transition">
                <span className={`inline-block w-3 h-3 rounded-full ${n.color} mb-1`}></span>
                <span className="text-[10px] font-mono font-bold text-slate-400 block">{n.type}</span>
                <strong className="text-white text-xs font-bold block">{n.label}</strong>
              </div>
            ))}
          </div>

          {/* Relational Edges List */}
          <div className="space-y-3 pt-4 border-t border-slate-800">
            <h3 className="text-xs font-bold text-slate-300">روابط التقدير والمخاطر الشبكية (Relational Edges)</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {graphData.edges.map((e, idx) => (
                <div key={idx} className="bg-slate-950 p-3 rounded-xl border border-slate-800/80 text-xs flex justify-between items-center">
                  <span className="text-slate-300 font-bold">{e.from}</span>
                  <span className="text-[10px] font-mono font-bold bg-indigo-500/20 text-indigo-300 px-2 py-0.5 rounded border border-indigo-500/30">
                    -- [{e.relation}] --&gt;
                  </span>
                  <span className="text-white font-bold">{e.to}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

      </div>
    </div>
  );
};
