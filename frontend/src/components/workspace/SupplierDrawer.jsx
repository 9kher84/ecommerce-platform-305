import React, { useState } from 'react';
import { Button } from '../common/Button';
import { useCommercialTimeline, useSubmitRevision, useAcceptRevision } from '../../hooks/queries/commercialQueries';

export const SupplierDrawer = ({ isOpen, processId, workPackage, onClose, onAwardSuccess }) => {
  const [counterPrice, setCounterPrice] = useState('');
  const [counterNotes, setCounterNotes] = useState('');
  const [showCounterForm, setShowCounterForm] = useState(false);

  const { data: response, isLoading, isError } = useCommercialTimeline(processId);
  const counterMutation = useSubmitRevision();
  const acceptMutation = useAcceptRevision();

  if (!isOpen) return null;

  const process = response?.data;
  const revisions = process?.negotiationSheets || [];
  const latestRevision = revisions.length > 0 ? revisions[revisions.length - 1] : null;

  const [awardSuccess, setAwardSuccess] = useState(null);

  const handleAccept = () => {
    if (window.confirm('هل أنت متأكد من قبول هذا العرض والترسية؟')) {
      acceptMutation.mutate(processId, {
        onSuccess: (res) => {
          setAwardSuccess(res?.data || res || { success: true });
          onAwardSuccess && onAwardSuccess(res);
        }
      });
    }
  };

  const handleSendCounter = (e) => {
    e.preventDefault();
    if (!counterPrice) return;
    counterMutation.mutate({
      processId,
      payload: {
        terms: { price: parseFloat(counterPrice) },
        notes: counterNotes
      }
    }, {
      onSuccess: () => {
        alert('تم إرسال العرض المقابل بنجاح!');
        setShowCounterForm(false);
        setCounterPrice('');
        setCounterNotes('');
      }
    });
  };

  return (
    <div className="fixed inset-0 z-50 overflow-hidden bg-slate-900/50 backdrop-blur-sm flex justify-end transition-opacity">
      <div className="w-full max-w-2xl bg-white h-full shadow-2xl flex flex-col justify-between overflow-y-auto transform transition-transform">
        
        {/* Drawer Header */}
        <div className="bg-slate-900 text-white p-6 flex justify-between items-center border-b border-slate-800">
          <div>
            <span className="text-xs text-amber-400 font-bold uppercase tracking-wider block">
              حزمة: {typeof workPackage?.name === 'object' ? (workPackage.name?.name_ar || workPackage.name?.name_en || 'تفاوض تجاري') : (workPackage?.name || 'تفاوض تجاري')}
            </span>
            <h3 className="text-xl font-black mt-1">تفاصيل العرض والمفاضلة وتوجيه القرار</h3>
          </div>
          <button 
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-slate-800 text-slate-400 hover:text-white flex items-center justify-center font-bold text-lg"
          >
            ✕
          </button>
        </div>

        {/* Drawer Body */}
        <div className="p-6 space-y-6 flex-1 overflow-y-auto">
          {awardSuccess && (
            <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-5 text-emerald-900 space-y-3 shadow-sm">
              <div className="flex items-center gap-3">
                <span className="text-2xl">🏆</span>
                <div>
                  <h4 className="font-bold text-base">تم اعتماد الترسية وإنشاء عقد الصفقة بنجاح!</h4>
                  <p className="text-xs text-emerald-700 mt-0.5">
                    تم تحديث حالة طلب الشراء ونقل العرض التجاري إلى عقد صفقة فعال (Active Deal).
                  </p>
                </div>
              </div>
              <div className="flex justify-end gap-2 pt-2 border-t border-emerald-200/60">
                <Button size="sm" onClick={() => { setAwardSuccess(null); onClose(); }}>
                  المتابعة في مساحة العمل (Workspace) ❯
                </Button>
              </div>
            </div>
          )}

          {isLoading && <div className="text-center py-8 text-gray-500">جاري تحميل تفاصيل التفاوض...</div>}
          {isError && <div className="text-center py-8 text-red-500">حدث خطأ في تحميل بيانات التفاوض.</div>}

          {process && (
            <>
              {/* Status Banner */}
              <div className="bg-indigo-50 border border-indigo-200 rounded-xl p-4 flex justify-between items-center">
                <div>
                  <span className="text-xs text-indigo-700 font-bold block">حالة العملية الحالية</span>
                  <span className="text-lg font-black text-indigo-900">
                    {typeof process?.status === 'string' ? process.status.toUpperCase() : (process?.status?.name_ar || process?.status?.name_en || 'WAITING_BUYER')}
                  </span>
                </div>
                <div className="flex gap-2">
                  <Button size="sm" onClick={handleAccept} isLoading={acceptMutation.isPending}>
                    🏆 اعتماد الترسية الفوري (Award)
                  </Button>
                </div>
              </div>

              {/* 🔥 AI DECISION GUIDANCE BOX (Trade-Off Comparison) */}
              <div className="bg-gradient-to-br from-indigo-900 to-slate-900 text-white rounded-xl p-5 shadow-md space-y-3">
                <div className="flex items-center gap-2 text-indigo-300 font-bold text-xs">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping"></span>
                  🤖 AI Decision Engine | تحليل وتوجيه القرار الأفضل
                </div>

                <div className="grid grid-cols-3 gap-2 text-center text-xs">
                  <div className="bg-slate-800/80 p-2 rounded-lg border border-slate-700">
                    <span className="text-slate-400 text-[10px] block">المورد A</span>
                    <strong className="text-emerald-400 block mt-0.5">سعر أقل</strong>
                  </div>
                  <div className="bg-indigo-950/80 p-2 rounded-lg border border-indigo-500/50">
                    <span className="text-indigo-300 text-[10px] block">المورد B (الموصى به)</span>
                    <strong className="text-amber-300 block mt-0.5">تسليم أسرع ⚡</strong>
                  </div>
                  <div className="bg-slate-800/80 p-2 rounded-lg border border-slate-700">
                    <span className="text-slate-400 text-[10px] block">المورد C</span>
                    <strong className="text-blue-300 block mt-0.5">جودة أعلى</strong>
                  </div>
                </div>

                <p className="text-xs text-slate-200 bg-indigo-950/60 p-3 rounded-lg border border-indigo-800/50 leading-relaxed">
                  💡 <strong>التوصية الذكية:</strong> أوصي بالمورد B لأن التأخير في التسليم سيكلف المشروع أكثر من فرق السعر البالغ 4,500 ريال.
                </p>
              </div>

              {/* Latest Revision Offer Terms */}
              {latestRevision && (
                <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm space-y-3">
                  <h4 className="font-bold text-sm text-gray-900 border-b border-gray-100 pb-2">شروط العرض الحالي (Revision {latestRevision.version})</h4>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-xs text-gray-500 font-bold block">السعر المطلوب:</span>
                      <span className="text-xl font-black text-indigo-600">
                        {latestRevision.terms?.price || latestRevision.terms?.grandTotal || 'غير محدد'} ريال
                      </span>
                    </div>
                    <div>
                      <span className="text-xs text-gray-500 font-bold block">تاريخ التقديم:</span>
                      <span className="text-sm font-medium text-gray-800">
                        {new Date(latestRevision.createdAt).toLocaleString()}
                      </span>
                    </div>
                  </div>
                  {latestRevision.notes && (
                    <div className="bg-gray-50 p-3 rounded text-xs text-gray-600 mt-2">
                      ملاحظات المورد: {latestRevision.notes}
                    </div>
                  )}
                </div>
              )}

              {/* Counter Offer Toggle Form */}
              <div className="border-t border-gray-200 pt-4 space-y-4">
                {!showCounterForm ? (
                  <Button variant="secondary" className="w-full" onClick={() => setShowCounterForm(true)}>
                    + تقديم عرض مقابل (Counter Offer)
                  </Button>
                ) : (
                  <form onSubmit={handleSendCounter} className="bg-gray-50 border border-gray-200 rounded-xl p-4 space-y-3">
                    <h4 className="font-bold text-sm text-gray-900">تقديم عرض مقابل</h4>
                    <div>
                      <label className="text-xs font-bold text-gray-700 block mb-1">السعر المقترح (ريال)</label>
                      <input 
                        type="number" 
                        required
                        value={counterPrice}
                        onChange={(e) => setCounterPrice(e.target.value)}
                        placeholder="أدخل السعر المقترح" 
                        className="w-full border rounded p-2 text-sm outline-none focus:ring-1 focus:ring-indigo-500"
                      />
                    </div>
                    <div>
                      <label className="text-xs font-bold text-gray-700 block mb-1">ملاحظات العرض المقابل</label>
                      <textarea 
                        rows={2}
                        value={counterNotes}
                        onChange={(e) => setCounterNotes(e.target.value)}
                        placeholder="أضف أي مبررات أو شروط إضافية" 
                        className="w-full border rounded p-2 text-sm outline-none focus:ring-1 focus:ring-indigo-500"
                      />
                    </div>
                    <div className="flex gap-2 justify-end">
                      <Button type="button" variant="secondary" size="sm" onClick={() => setShowCounterForm(false)}>
                        إلغاء
                      </Button>
                      <Button type="submit" size="sm" isLoading={counterMutation.isPending}>
                        إرسال العرض المقابل
                      </Button>
                    </div>
                  </form>
                )}
              </div>

              {/* Revision History Timeline */}
              <div className="space-y-3">
                <h4 className="font-bold text-sm text-gray-900">سجل التغييرات والعروض (Revision History)</h4>
                <div className="space-y-2">
                  {revisions.map((rev) => (
                    <div key={rev.version} className="bg-gray-50 border border-gray-200 rounded-lg p-3 text-xs flex justify-between items-center">
                      <div>
                        <span className="font-bold text-indigo-700">جولة {rev.version} ({rev.decision})</span>
                        <span className="text-gray-500 text-[11px] block mt-0.5">{new Date(rev.createdAt).toLocaleString()}</span>
                      </div>
                      <span className="font-bold text-gray-900">{rev.terms?.price || '—'} ريال</span>
                    </div>
                  ))}
                </div>
              </div>
            </>
          )}
        </div>

        {/* Drawer Footer */}
        <div className="bg-gray-50 border-t border-gray-200 p-4 flex justify-between items-center">
          <span className="text-xs text-gray-500">تم الحفاظ على السياق (No Page Jump)</span>
          <Button variant="secondary" size="sm" onClick={onClose}>
            إغلاق اللوحة
          </Button>
        </div>
      </div>
    </div>
  );
};
