import React, { useState } from 'react';
import { Button } from '../../components/common/Button';

export const NegotiationWorkspacePage = () => {
  const [terms, setTerms] = useState({
    priceSAR: 4200,
    quantity: 150,
    deliveryDays: 5,
    warrantyMonths: 12,
    paymentTerms: '30_DAYS_NET'
  });

  const [history, setHistory] = useState([
    { round: 1, actor: 'المشتري', priceSAR: 4000, deliveryDays: 3, timestamp: '10:15 AM' },
    { round: 2, actor: 'البائع (عرض مضاد)', priceSAR: 4200, deliveryDays: 5, timestamp: '10:42 AM' }
  ]);

  const handleSendCounter = (e) => {
    e.preventDefault();
    setHistory([...history, {
      round: history.length + 1,
      actor: 'عرض مضاد جديد',
      priceSAR: terms.priceSAR,
      deliveryDays: terms.deliveryDays,
      timestamp: 'الآن'
    }]);
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 p-6 font-sans">
      <div className="max-w-[1400px] mx-auto space-y-6">
        
        {/* Header */}
        <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl flex flex-wrap justify-between items-center gap-4">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-indigo-600 flex items-center justify-center text-xl font-bold">🤝</div>
            <div>
              <h1 className="text-xl font-black text-white">مساحة التفاوض الهيكلية (Structured Negotiation Workspace)</h1>
              <p className="text-xs text-slate-400">تفاوض منظم على بنود الأسعار، مواعيد التسليم، شروط التوريد والضمان دون دردشة عشوائية.</p>
            </div>
          </div>
          <span className="bg-amber-500/10 text-amber-400 border border-amber-500/20 text-xs px-3 py-1 rounded-full font-mono">ROUND {history.length} ACTIVE</span>
        </div>

        {/* Workspace Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* Terms Form */}
          <div className="lg:col-span-2 bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-6">
            <h2 className="text-base font-bold text-white border-b border-slate-800 pb-3">البنود التجارية القابلة للتعديل</h2>
            
            <form onSubmit={handleSendCounter} className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
              <div>
                <label className="block text-slate-300 font-bold mb-1">السعر المقترح للوحدة (SAR)</label>
                <input 
                  type="number"
                  value={terms.priceSAR}
                  onChange={e => setTerms({ ...terms, priceSAR: Number(e.target.value) })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-white focus:outline-none focus:border-indigo-500 font-mono"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-bold mb-1">الكمية المطلوبة</label>
                <input 
                  type="number"
                  value={terms.quantity}
                  onChange={e => setTerms({ ...terms, quantity: Number(e.target.value) })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-white focus:outline-none focus:border-indigo-500 font-mono"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-bold mb-1">مهلة التوصيل (أيام)</label>
                <input 
                  type="number"
                  value={terms.deliveryDays}
                  onChange={e => setTerms({ ...terms, deliveryDays: Number(e.target.value) })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-white focus:outline-none focus:border-indigo-500 font-mono"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-bold mb-1">فترة الضمان (أشهر)</label>
                <input 
                  type="number"
                  value={terms.warrantyMonths}
                  onChange={e => setTerms({ ...terms, warrantyMonths: Number(e.target.value) })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-white focus:outline-none focus:border-indigo-500 font-mono"
                />
              </div>

              <div className="md:col-span-2 pt-4 border-t border-slate-800 flex justify-end gap-3">
                <Button type="submit" className="bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs px-6">
                  إرسال العرض المضاد المعتمد (Send Counter Offer)
                </Button>
              </div>
            </form>
          </div>

          {/* Revision History Log */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4">
            <h2 className="text-sm font-bold text-white border-b border-slate-800 pb-3">سجل تعديلات المفاوضات</h2>
            <div className="space-y-3">
              {history.map((item, idx) => (
                <div key={idx} className="bg-slate-950 border border-slate-800/80 p-3 rounded-xl space-y-1 text-xs">
                  <div className="flex justify-between font-bold">
                    <span className="text-indigo-400">{item.actor}</span>
                    <span className="text-slate-500 font-mono text-[10px]">{item.timestamp}</span>
                  </div>
                  <div className="text-slate-300 font-mono">
                    SAR {item.priceSAR.toLocaleString()} | {item.deliveryDays} أيام توصيل
                  </div>
                </div>
              ))}
            </div>
          </div>

        </div>

      </div>
    </div>
  );
};
