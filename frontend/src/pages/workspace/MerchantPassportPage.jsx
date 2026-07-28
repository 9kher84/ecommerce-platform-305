import React from 'react';
import { Button } from '../../components/common/Button';

export const MerchantPassportPage = () => {
  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 p-6 font-sans">
      <div className="max-w-[1400px] mx-auto space-y-6">
        
        {/* Header Passport Card */}
        <div className="bg-slate-900 border border-slate-800 p-6 rounded-3xl shadow-2xl flex flex-wrap justify-between items-center gap-6">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-2xl bg-amber-500/20 border border-amber-500/30 text-amber-400 flex items-center justify-center text-3xl font-bold">
              🛡️
            </div>
            <div>
              <div className="flex items-center gap-3">
                <h1 className="text-xl font-black text-white">جواز السفر التجاري للمورد (Merchant Commercial Passport)</h1>
                <span className="bg-amber-500/10 text-amber-300 border border-amber-500/20 text-xs px-3 py-0.5 rounded-full font-mono font-bold">
                  GOLD VERIFIED SELLER
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-1">الهوية التجارية الموثقة والتراكمية المستندة للأدلة المباشرة (Invoices, POs, Shipping Bills, Certificates).</p>
            </div>
          </div>

          <Button className="bg-indigo-600 hover:bg-indigo-500 text-white text-xs px-6 font-bold">
            + رفع إثبات مبيعات خارجي (Upload Commercial Evidence)
          </Button>
        </div>

        {/* Commercial CV Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-slate-900 border border-slate-800 p-4 rounded-2xl space-y-1">
            <span className="text-xs text-slate-400">إجمالي حجم التجارة الموثقة</span>
            <div className="text-2xl font-black text-amber-400 font-mono">SAR 38,000,000</div>
            <span className="text-[10px] text-slate-500 block">12M داخل المنصة | 26M مبيعات خارجية موثقة</span>
          </div>

          <div className="bg-slate-900 border border-slate-800 p-4 rounded-2xl space-y-1">
            <span className="text-xs text-slate-400">سنوات النشاط الفعلي</span>
            <div className="text-2xl font-black text-white font-mono">8 سنوات</div>
            <span className="text-[10px] text-slate-500 block">منذ عام 2018</span>
          </div>

          <div className="bg-slate-900 border border-slate-800 p-4 rounded-2xl space-y-1">
            <span className="text-xs text-slate-400">إجمالي العقود المنجزة</span>
            <div className="text-2xl font-black text-indigo-400 font-mono">624 عقد</div>
            <span className="text-[10px] text-slate-500 block">نسبة الالتزام: 98.6%</span>
          </div>

          <div className="bg-slate-900 border border-slate-800 p-4 rounded-2xl space-y-1">
            <span className="text-xs text-slate-400">معدل المرتجعات</span>
            <div className="text-2xl font-black text-emerald-400 font-mono">0.8%</div>
            <span className="text-[10px] text-slate-500 block">تسليم بالموعد: 96%</span>
          </div>
        </div>

        {/* Verified Commercial Evidence List */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4">
          <h2 className="text-sm font-bold text-white border-b border-slate-800 pb-3">سجل الأدلة التجارية الموثقة بالذكاء الاصطناعي (AI Verified Evidence)</h2>
          
          <div className="space-y-3 text-xs">
            <div className="bg-slate-950 border border-slate-800 p-4 rounded-xl flex justify-between items-center">
              <div>
                <div className="font-bold text-white">فاتورة توريد حديد تسليح 150 طن (شركة سابك)</div>
                <div className="text-slate-400 text-[11px] mt-0.5">تم التحقق من الختم والتاريخ ورقم الفاتورة بآلية Hash Duplicate Check</div>
              </div>
              <span className="bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-3 py-1 rounded-full font-mono text-[10px]">
                VERIFIED • SAR 630,000
              </span>
            </div>

            <div className="bg-slate-950 border border-slate-800 p-4 rounded-xl flex justify-between items-center">
              <div>
                <div className="font-bold text-white">عقد توريد خرسانة جاهزة للمشروع الرياض ريزيدنس</div>
                <div className="text-slate-400 text-[11px] mt-0.5">موثق بشراط الاعتماد والتسليم</div>
              </div>
              <span className="bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-3 py-1 rounded-full font-mono text-[10px]">
                VERIFIED • SAR 1,200,000
              </span>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
};
