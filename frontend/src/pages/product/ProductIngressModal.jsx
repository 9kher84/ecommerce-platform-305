import React, { useState } from 'react';
import { Button } from '../../components/common/Button';

export const ProductIngressModal = ({ isOpen = true, onClose }) => {
  const [mode, setMode] = useState('QUICK'); // 'QUICK' | 'PROFESSIONAL' | 'AI_IMPORT'
  const [formData, setFormData] = useState({ name: '', price: '', quantity: '', city: 'الرياض' });
  const [score, setScore] = useState(20);
  const [isPublished, setIsPublished] = useState(false);

  const handleQuickSubmit = (e) => {
    e.preventDefault();
    setIsPublished(true);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md z-50 flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-3xl shadow-2xl overflow-hidden">
        
        {/* Header Tabs */}
        <div className="p-6 bg-slate-950/50 border-b border-slate-800 flex flex-wrap justify-between items-center gap-4">
          <div>
            <h2 className="text-lg font-black text-white">إضافة منتج جديد للكتالوج (Product Ingress Engine)</h2>
            <p className="text-xs text-slate-400 mt-0.5">اختر نمط الإضافة السريع (&lt;60 ثانية) أو النمط المحترف أو السحب الذكي بالذكاء الاصطناعي.</p>
          </div>

          <div className="flex bg-slate-900 border border-slate-800 rounded-xl p-1 text-xs">
            <button 
              onClick={() => setMode('QUICK')}
              className={`px-4 py-1.5 rounded-lg font-bold transition ${mode === 'QUICK' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-white'}`}>
              ⚡ النمط السريع (Quick Add)
            </button>
            <button 
              onClick={() => setMode('PROFESSIONAL')}
              className={`px-4 py-1.5 rounded-lg font-bold transition ${mode === 'PROFESSIONAL' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-white'}`}>
              🏢 النمط المحترف (Pro)
            </button>
            <button 
              onClick={() => setMode('AI_IMPORT')}
              className={`px-4 py-1.5 rounded-lg font-bold transition ${mode === 'AI_IMPORT' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-white'}`}>
              🤖 سحب بالذكاء (AI Import)
            </button>
          </div>
        </div>

        {/* Completeness Bar */}
        <div className="bg-slate-950 border-b border-slate-800/80 px-6 py-3 flex justify-between items-center text-xs">
          <div className="flex items-center gap-3 w-2/3">
            <span className="text-slate-400 font-bold whitespace-nowrap">مؤشر الجودة:</span>
            <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
              <div className="bg-indigo-500 h-full transition-all duration-300" style={{ width: `${score}%` }}></div>
            </div>
            <span className="font-mono font-bold text-indigo-400">{score}%</span>
          </div>

          <span className="bg-indigo-500/10 text-indigo-300 border border-indigo-500/20 px-3 py-0.5 rounded-full font-mono text-[10px]">
            {score >= 80 ? 'Verified Product' : score >= 60 ? 'Complete Info' : 'Basic Listing'}
          </span>
        </div>

        {/* Content Body */}
        <div className="p-6">
          {isPublished ? (
            <div className="text-center py-8 space-y-4">
              <div className="w-16 h-16 rounded-full bg-emerald-500/20 border border-emerald-500/30 text-emerald-400 text-3xl flex items-center justify-center mx-auto">
                ✓
              </div>
              <h3 className="text-xl font-black text-white">تم نشر المنتج بنجاح خلال 45 ثانية!</h3>
              <p className="text-xs text-slate-400 max-w-md mx-auto">تم إدراج منتجك في السوق المباشر. يمكنك إكمال المواصفات المتقدمة لاحقاً للحصول على ظهور أعلى في نتائج البحث الذكية.</p>
              <Button onClick={() => setIsPublished(false)} className="bg-indigo-600 text-white text-xs px-6">إضافة منتج آخر</Button>
            </div>
          ) : mode === 'QUICK' ? (
            <form onSubmit={handleQuickSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1">اسم المنتج <span className="text-rose-500">*</span></label>
                  <input 
                    required
                    value={formData.name}
                    onChange={e => setFormData({ ...formData, name: e.target.value })}
                    placeholder="مثال: حديد تسليح 12 مم سابك"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2 text-xs text-white focus:outline-none focus:border-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1">السعر التقديري (SAR)</label>
                  <input 
                    type="number"
                    value={formData.price}
                    onChange={e => setFormData({ ...formData, price: e.target.value })}
                    placeholder="مثال: 2850"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2 text-xs text-white focus:outline-none focus:border-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1">الكمية المتوفرة</label>
                  <input 
                    type="number"
                    value={formData.quantity}
                    onChange={e => setFormData({ ...formData, quantity: e.target.value })}
                    placeholder="مثال: 100"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2 text-xs text-white focus:outline-none focus:border-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1">المدينة والتغطية</label>
                  <select 
                    value={formData.city}
                    onChange={e => setFormData({ ...formData, city: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2 text-xs text-white focus:outline-none focus:border-indigo-500">
                    <option value="الرياض">الرياض</option>
                    <option value="جدة">جدة</option>
                    <option value="الدمام">الدمام</option>
                  </select>
                </div>
              </div>

              <div className="pt-4 border-t border-slate-800 flex justify-end gap-3">
                <Button onClick={onClose} variant="ghost" className="text-xs">إلغاء</Button>
                <Button type="submit" className="bg-indigo-600 text-white text-xs px-6 font-bold">⚡ نشر سريع خلال 60 ثانية</Button>
              </div>
            </form>
          ) : mode === 'AI_IMPORT' ? (
            <div className="space-y-4 text-center py-6 border-2 border-dashed border-slate-800 rounded-2xl bg-slate-950/40">
              <div className="text-4xl">📄</div>
              <h3 className="text-sm font-bold text-white">اسحب الفاتورة أو ملف الكتالوج (PDF / Excel / Image)</h3>
              <p className="text-xs text-slate-400">سيقوم الذكاء الاصطناعي باستخراج الأسماء، الأكواد، المواصفات والأسعار وتعبئتها تلقائياً.</p>
              <Button className="bg-indigo-600 text-white text-xs px-6">تحميل الملف واستخراج البيانات (AI Parse)</Button>
            </div>
          ) : (
            <div className="text-xs text-slate-400 text-center py-6">نموذج المواصفات المتقدمة (SKU, GTIN, Tier Pricing, Datasheet) جاهز للعمل.</div>
          )}
        </div>

      </div>
    </div>
  );
};
