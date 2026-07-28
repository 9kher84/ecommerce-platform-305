import React, { useState } from 'react';
import { Button } from '../../components/common/Button';

export const HumanAiWorkspace = () => {
  const [collaborations, setCollaborations] = useState([
    {
      id: 1,
      title: 'مراجعة واعتماد ترسية مناقصة الحديد (RFQ #804)',
      humanAssignee: 'محمد (مدير المشتريات)',
      aiAssignee: 'Commercial Procurement Agent',
      status: 'HUMAN_APPROVAL_NEEDED',
      confidence: 96,
      aiRecommendation: 'التوصية بترسية الصفقة على شركة المباني الذهبية بسعر SAR 450,000 وتوفير 6.5%',
      history: [
        { sender: 'AI Agent', text: 'قام الوكيل باستكشاف 4 موردين وتصفية أفضل عرض تجاري.', time: '10:15 AM' },
        { sender: 'Human Manager', text: 'طلب مراجعة الشرط الجزائي قبل التوقيع.', time: '10:30 AM' },
        { sender: 'AI Agent', text: 'تم فحص العقد وتأكيد مطابقة الشرط الجزائي لسياسات الشركة.', time: '10:45 AM' }
      ]
    }
  ]);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans p-6">
      <div className="max-w-[1600px] mx-auto space-y-6">
        
        {/* Header */}
        <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl shadow-xl flex flex-wrap justify-between items-center gap-6">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-indigo-600 flex items-center justify-center font-black text-2xl shadow-lg shadow-indigo-500/20">
              🤝
            </div>
            <div>
              <div className="flex items-center gap-3">
                <h1 className="text-xl font-black text-white">مساحة العمل المشتركة (Human + AI Collaboration Workspace)</h1>
                <span className="bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-xs px-3 py-0.5 rounded-full font-mono font-bold">
                  Active Team Collaboration
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-1">التعاون المتناغم بين الموظفين البشر والوكلاء الرقميين لإنجاز العمليات المعقدة والاعتمادات.</p>
            </div>
          </div>
        </div>

        {/* Task Collaboration Stream */}
        {collaborations.map(collab => (
          <div key={collab.id} className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-6 shadow-xl">
            
            <div className="flex justify-between items-start border-b border-slate-800 pb-4">
              <div>
                <span className="text-[10px] font-mono font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30 px-2.5 py-0.5 rounded">
                  {collab.status}
                </span>
                <h2 className="text-base font-bold text-white mt-2">{collab.title}</h2>
                <div className="flex items-center gap-4 text-xs text-slate-400 mt-1">
                  <span>👤 الموظف: <strong className="text-white">{collab.humanAssignee}</strong></span>
                  <span>🤖 الوكيل الرقمي: <strong className="text-indigo-400">{collab.aiAssignee}</strong></span>
                </div>
              </div>

              <div className="text-right">
                <span className="text-[10px] text-slate-400 font-bold block">نسبة الثقة (Confidence)</span>
                <strong className="text-emerald-400 text-lg font-black">{collab.confidence}%</strong>
              </div>
            </div>

            {/* AI Recommendation Banner */}
            <div className="bg-indigo-950/40 border border-indigo-500/30 p-4 rounded-xl space-y-1">
              <span className="text-[10px] font-bold text-indigo-400 block font-mono">توصية الوكيل الذكي (AI Agent Recommendation)</span>
              <p className="text-xs font-bold text-white">{collab.aiRecommendation}</p>
            </div>

            {/* Collaboration Timeline */}
            <div className="space-y-3">
              <h3 className="text-xs font-bold text-slate-300">سجل النقاش والتعاون الحركي (Collaboration Log)</h3>
              <div className="space-y-2">
                {collab.history.map((h, idx) => (
                  <div key={idx} className="bg-slate-950 p-3 rounded-xl border border-slate-800 text-xs flex justify-between items-center">
                    <div className="flex items-center gap-2">
                      <span className={`font-bold px-2 py-0.5 rounded text-[10px] ${h.sender === 'AI Agent' ? 'bg-indigo-500/20 text-indigo-300' : 'bg-emerald-500/20 text-emerald-300'}`}>
                        {h.sender}
                      </span>
                      <span className="text-slate-300">{h.text}</span>
                    </div>
                    <span className="text-slate-500 font-mono text-[10px]">{h.time}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Actions */}
            <div className="flex gap-3 pt-2">
              <Button className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs px-6">
                موافقة واعتماد التوصية ✅
              </Button>
              <Button className="bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs px-6 border border-slate-700">
                طلب تعديل من الوكيل 💬
              </Button>
            </div>

          </div>
        ))}

      </div>
    </div>
  );
};
