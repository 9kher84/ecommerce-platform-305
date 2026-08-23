import React, { useState } from 'react';
import { Button } from '../common/Button';

export const SimpleWorkspaceRenderer = ({ project, workPackages = [], onSelectProcess }) => {
  const [chatInput, setChatInput] = useState('');
  const [messages, setMessages] = useState([
    { id: 1, sender: 'system', text: `مرحباً بك! مساحة الشراء السريعة لـ: "${project?.title || 'طلب توريد جديد'}"` }
  ]);

  const handleSend = (e) => {
    e.preventDefault();
    if (!chatInput.trim()) return;
    setMessages(prev => [...prev, { id: Date.now(), sender: 'user', text: chatInput }]);
    setChatInput('');
  };

  const firstPackage = workPackages[0];
  const processes = firstPackage?.commercialProcesses || [];
  const firstProcess = processes[0];

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* Simple Header Banner */}
      <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm flex justify-between items-center">
        <div>
          <span className="text-xs font-bold text-indigo-600 bg-indigo-50 px-2.5 py-1 rounded-full border border-indigo-100">
            طلب شراء سريع (Simple View)
          </span>
          <h2 className="text-xl font-black text-gray-900 mt-2">{project?.header?.title || project?.title || 'طلب شراء فردي'}</h2>
          <p className="text-xs text-gray-500 mt-1">تواصل مالي وتفاوض مباشر مع المورد المعترف به.</p>
        </div>
        <div className="text-right">
          <span className="text-xs text-gray-400 font-bold block">الحالة الحالية</span>
          <span className="text-sm font-bold text-emerald-600 bg-emerald-50 px-3 py-1 rounded-lg border border-emerald-200 block mt-1">
            جاري التوافق
          </span>
        </div>
      </div>

      {/* Stream / Social Chat Renderer */}
      <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm space-y-4 min-h-[400px] flex flex-col justify-between">
        <div className="space-y-4 overflow-y-auto max-h-[450px] pr-2">
          {messages.map((msg) => (
            <div 
              key={msg.id}
              className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div className={`max-w-md p-4 rounded-2xl text-sm space-y-2 ${
                msg.sender === 'user' 
                  ? 'bg-indigo-600 text-white rounded-br-none'
                  : msg.sender === 'system'
                  ? 'bg-gray-100 text-gray-700 w-full text-center rounded-xl font-medium text-xs'
                  : 'bg-slate-100 text-slate-900 border border-slate-200 rounded-bl-none'
              }`}>
                {msg.name && <strong className="block font-bold text-indigo-900 text-xs">{msg.name}</strong>}
                <p className="leading-relaxed">{msg.text}</p>
                {msg.price && (
                  <div className="bg-white p-2.5 rounded-xl border border-slate-200 mt-2 flex justify-between items-center text-xs">
                    <span className="font-bold text-slate-600">العرض المقدم:</span>
                    <strong className="text-indigo-600 text-base">{msg.price}</strong>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* Quick Decision Actions Bar (Simple Accept / Reject / Negotiate) */}
        {firstProcess && (
          <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 flex flex-wrap justify-between items-center gap-3">
            <span className="text-xs font-bold text-slate-700">اتخاذ القرار الفوري:</span>
            <div className="flex gap-2">
              <Button 
                size="sm" 
                onClick={() => onSelectProcess && onSelectProcess(firstProcess, firstPackage)}
              >
                ✅ قبول العرض
              </Button>
              <Button 
                size="sm" 
                variant="secondary"
                onClick={() => onSelectProcess && onSelectProcess(firstProcess, firstPackage)}
              >
                💬 تفاوض
              </Button>
              <Button size="sm" variant="secondary" className="text-red-600 hover:bg-red-50">
                ❌ رفض
              </Button>
            </div>
          </div>
        )}

        {/* Simple Chat Input */}
        <form onSubmit={handleSend} className="flex gap-2 pt-2 border-t border-gray-100">
          <input
            type="text"
            placeholder="اكتب ردك أو استفسارك للمورد..."
            value={chatInput}
            onChange={(e) => setChatInput(e.target.value)}
            className="flex-1 border rounded-xl px-4 py-2 text-sm outline-none focus:ring-2 focus:ring-indigo-500 bg-gray-50"
          />
          <button type="submit" className="bg-indigo-600 text-white px-5 py-2 rounded-xl text-sm font-bold hover:bg-indigo-700 transition">
            إرسال
          </button>
        </form>
      </div>
    </div>
  );
};
