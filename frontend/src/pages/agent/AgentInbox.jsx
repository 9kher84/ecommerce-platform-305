import React, { useState } from 'react';
import { Button } from '../../components/common/Button';

export const AgentInbox = () => {
  const [messages, setMessages] = useState([
    { id: 1, type: 'RFQ_CREATED', title: 'تم إنشاء طلب سعر تلقائياً (RFQ #804)', details: 'طلب 200 طن حديد تسليح لمشروع الرياض عبر الواتساب', time: '10:42 AM', status: 'EXECUTED', channel: 'WhatsApp' },
    { id: 2, type: 'APPROVAL_REQUIRED', title: 'مطلوب موافقة اعتماد ترسية (SAR 450,000)', details: 'عرض شركة المباني الذهبية يتجاوز الحد التلقائي للوكيل (SAR 50,000)', time: '09:15 AM', status: 'PENDING_APPROVAL', channel: 'Email' },
    { id: 3, type: 'SUPPLIER_FOUND', title: 'تم مطابقة 4 موردين معتمدين', details: 'قام الوكيل باستكشاف السوق وتصفية الموردين المؤهلين', time: 'أمس 04:30 PM', status: 'COMPLETED', channel: 'Web' }
  ]);

  const [inputMessage, setInputMessage] = useState('');
  const [isSending, setIsSending] = useState(false);

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!inputMessage.trim()) return;

    const userMsg = inputMessage;
    setInputMessage('');
    setIsSending(true);

    try {
      const res = await fetch('/api/agent/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: userMsg, channel: 'WEB' })
      });
      const data = await res.json();

      if (data.success) {
        setMessages(prev => [
          {
            id: Date.now(),
            type: 'AGENT_RESPONSE',
            title: `رد الوكيل الشخصي (Agent)`,
            details: data.reply,
            time: 'الآن',
            status: data.runtimeResult?.status || 'EXECUTED',
            channel: 'Web'
          },
          ...prev
        ]);
      }
    } catch (err) {
      console.warn("Agent Inbox Send Error:", err);
    } finally {
      setIsSending(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans p-6">
      <div className="max-w-[1400px] mx-auto space-y-6">
        
        {/* Header */}
        <div className="flex flex-wrap justify-between items-center bg-slate-900 border border-slate-800 p-6 rounded-2xl shadow-xl">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-2xl">🤖</span>
              <h1 className="text-xl font-black text-white">صندوق الوكيل الشخصي (Agent Inbox)</h1>
              <span className="bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 text-xs px-2.5 py-0.5 rounded-full font-mono font-bold">
                Omni-Channel Active
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-1">مركز إدارة التنبيهات والأوامر المتدفقة من الواتساب والبريد الإلكتروني والنظام المباشر.</p>
          </div>

          <div className="flex gap-3">
            <Button size="sm" className="bg-indigo-600 hover:bg-indigo-500 font-bold text-xs">
              + إضافة قناة جديدة (Add Channel)
            </Button>
          </div>
        </div>

        {/* Live Chat Input Console */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-lg">
          <form onSubmit={handleSendMessage} className="flex gap-3">
            <input 
              type="text" 
              value={inputMessage}
              onChange={e => setInputMessage(e.target.value)}
              placeholder="اكتب أمرك للوكيل هنا (مثال: أريد شراء 500 كيس إسمنت)..." 
              className="flex-1 bg-slate-950 border border-slate-800 px-4 py-3 rounded-xl text-xs outline-none focus:ring-2 focus:ring-indigo-500 text-white"
            />
            <Button type="submit" disabled={isSending} className="bg-indigo-600 hover:bg-indigo-500 font-bold text-xs px-6">
              {isSending ? 'جاري التنفيذ...' : 'إرسال الأمر 🚀'}
            </Button>
          </form>
        </div>

        {/* Messages Stream */}
        <div className="space-y-4">
          <h2 className="text-sm font-bold text-slate-300">تدفق الأحداث والموافقات الجارية (Activity & Approvals)</h2>
          
          {messages.map(m => (
            <div key={m.id} className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-md flex flex-wrap justify-between items-center gap-4 hover:border-slate-700 transition">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-mono font-bold bg-slate-800 text-indigo-300 px-2 py-0.5 rounded border border-slate-700">
                    {m.channel}
                  </span>
                  <h3 className="font-bold text-sm text-white">{m.title}</h3>
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                    m.status === 'PENDING_APPROVAL' ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30' : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                  }`}>
                    {m.status}
                  </span>
                </div>
                <p className="text-xs text-slate-400">{m.details}</p>
              </div>

              <div className="flex items-center gap-3">
                <span className="text-xs text-slate-500 font-mono">{m.time}</span>
                {m.status === 'PENDING_APPROVAL' && (
                  <Button size="sm" className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs">
                    اعتماد الطلب الآن ✅
                  </Button>
                )}
              </div>
            </div>
          ))}
        </div>

      </div>
    </div>
  );
};
