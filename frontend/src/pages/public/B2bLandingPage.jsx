import React from 'react';
import { useNavigate } from 'react-router-dom';

export const B2bLandingPage = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans flex flex-col dir-rtl">
      
      {/* Navigation Header */}
      <header className="border-b border-slate-800 bg-slate-900/80 backdrop-blur px-8 py-4 sticky top-0 z-50 flex justify-between items-center">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-indigo-600 flex items-center justify-center font-bold text-xl shadow-lg shadow-indigo-500/20">
            🏢
          </div>
          <div>
            <span className="font-black text-base text-white">MarketHub B2B</span>
            <span className="text-[10px] text-indigo-400 block font-mono">بورصة المشتريات المغلقة (Blind Procurement Exchange)</span>
          </div>
        </div>

        <nav className="hidden md:flex items-center gap-6 text-xs font-bold text-slate-300">
          <a href="#features" className="hover:text-indigo-400 transition">المزايا</a>
          <a href="#how-it-works" className="hover:text-indigo-400 transition">كيف نعمل</a>
          <a href="#pricing" className="hover:text-indigo-400 transition">الأسعار والربط</a>
          <a href="#faq" className="hover:text-indigo-400 transition">الأسئلة الشائعة</a>
        </nav>

        <div className="flex items-center gap-3">
          <button 
            onClick={() => navigate('/login')}
            className="text-xs font-bold text-slate-300 hover:text-white px-4 py-2 rounded-xl transition">
            تسجيل الدخول
          </button>
          <button 
            onClick={() => navigate('/register')}
            className="text-xs font-bold bg-indigo-600 hover:bg-indigo-500 text-white px-5 py-2.5 rounded-xl shadow-lg shadow-indigo-600/20 transition">
            انضم كتاجر / مشتري
          </button>
        </div>
      </header>

      {/* Hero Section */}
      <section className="px-8 py-20 max-w-6xl mx-auto text-center space-y-8">
        <span className="bg-indigo-500/10 text-indigo-300 border border-indigo-500/20 px-4 py-1.5 rounded-full text-xs font-mono font-bold inline-block">
          ⚡ أول منصة مشتريات مغلقة الهوية بالكامل في المملكة
        </span>

        <h1 className="text-4xl md:text-6xl font-black text-white leading-tight">
          منصة الوساطة التجارية B2B <br />
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-purple-400">
            يقودها الدستور التجاري والذكاء الاصطناعي
          </span>
        </h1>

        <p className="text-sm md:text-base text-slate-400 max-w-2xl mx-auto leading-relaxed">
          نربط كبار المشترين بالمنافسات والموردين المعتمدين بنموذج الهوية المخفية (Blind Identity)، مع حماية الصفقات بسلسلة البدلاء، الفواتير الموثقة، والسيرة التجارية الحقيقية.
        </p>

        <div className="flex flex-wrap justify-center gap-4 pt-4">
          <button 
            onClick={() => {
              const token = localStorage.getItem('token');
              if (token) {
                navigate('/requests');
              } else {
                navigate('/login');
              }
            }}
            className="bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold px-8 py-3.5 rounded-2xl shadow-xl shadow-indigo-600/30 transition">
            ابدأ بنشر طلب شراء (Create RFQ)
          </button>
          <button 
            onClick={() => navigate('/seller/platform')}
            className="bg-slate-900 border border-slate-800 hover:bg-slate-800 text-slate-200 text-xs font-bold px-8 py-3.5 rounded-2xl transition">
            استكشف منصة البائع (Seller Platform)
          </button>
        </div>
      </section>

      {/* Features Grid */}
      <section id="features" className="px-8 py-16 bg-slate-900/40 border-y border-slate-800/80">
        <div className="max-w-6xl mx-auto space-y-12">
          <div className="text-center space-y-2">
            <h2 className="text-2xl font-black text-white">الركائز الأساسية لبورصة MarketHub</h2>
            <p className="text-xs text-slate-400">قواعد تجارية حازمة تحمي خصوصية الطرفين وتضمن استدامة الصفقة</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-right">
            <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl space-y-3">
              <div className="w-12 h-12 rounded-xl bg-indigo-500/10 text-indigo-400 flex items-center justify-center text-2xl">🔒</div>
              <h3 className="text-sm font-bold text-white">نموذج الهوية المخفية (Blind Exchange)</h3>
              <p className="text-xs text-slate-400 leading-relaxed">حجب تام لبيانات التواصل وهويات المشتري والمورد حتى صدور الفاتورة المعتمدة لضمان عدالة التنافس.</p>
            </div>

            <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl space-y-3">
              <div className="w-12 h-12 rounded-xl bg-amber-500/10 text-amber-400 flex items-center justify-center text-2xl">🛡️</div>
              <h3 className="text-sm font-bold text-white">سلسلة البدلاء (Backup Cascade)</h3>
              <p className="text-xs text-slate-400 leading-relaxed">اختيار المورد الأساسي مع بديل أول وبديل ثاني، والتحويل الآلي للصفقة عند اعتذار أو تأخر المورد الأساسي.</p>
            </div>

            <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl space-y-3">
              <div className="w-12 h-12 rounded-xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center text-2xl">📜</div>
              <h3 className="text-sm font-bold text-white">الجواز التجاري الموثق (Merchant Passport)</h3>
              <p className="text-xs text-slate-400 leading-relaxed">استبدال النجوم بسيرة تجارية موثقة تجمع الصفقات الفعلية والمبيعات الخارجية المعتمدة بالـ AI.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-slate-800 px-8 py-8 text-center text-xs text-slate-500 space-y-2 mt-auto">
        <div>جميع الحقوق محفوظة © 2026 منصة MarketHub B2B Commercial OS</div>
        <div className="text-[11px] text-slate-600">منظومة تجارة مغلقة معتمدة بالدستور التجاري والذكاء الاصطناعي</div>
      </footer>

    </div>
  );
};
