import React, { useState } from 'react';
import { Button } from '../../components/common/Button';

export const CommercialExecutionWorkspacePage = () => {
  const [dealState, setDealState] = useState('SHIPPED'); // 'INVOICE' | 'SHIPPED' | 'DELIVERED' | 'WARRANTY' | 'CLOSED'

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 p-6 font-sans">
      <div className="max-w-[1400px] mx-auto space-y-6">
        
        {/* Header */}
        <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl flex flex-wrap justify-between items-center gap-4">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-emerald-600 flex items-center justify-center text-xl font-bold">🚛</div>
            <div>
              <h1 className="text-xl font-black text-white">مساحة متابعة التنفيذ الميداني (Execution & Fulfillment Workspace)</h1>
              <p className="text-xs text-slate-400">إدارة الشحنات، الاستلام، الضمان، المرتجعات، وتأكيد الفواتير بعد كشف الهوية.</p>
            </div>
          </div>
          <span className="bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-xs px-3 py-1 rounded-full font-mono">{dealState}</span>
        </div>

        {/* Unmasked Identity Invoice Card */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4">
          <div className="flex justify-between items-center border-b border-slate-800 pb-3">
            <h2 className="text-sm font-bold text-white">الفاتورة المعتمدة (Unmasked Identity Invoice #INV-2026-88)</h2>
            <span className="bg-indigo-500/10 text-indigo-300 border border-indigo-500/20 text-xs px-3 py-0.5 rounded-full">الهوية مكشوفة رسمياً</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-xs">
            <div className="bg-slate-950 border border-slate-800 p-4 rounded-xl space-y-1">
              <span className="text-slate-400 font-bold block">بيانات المشتري (Buyer Details)</span>
              <div className="text-white font-bold">شركة الإعمار والتطوير العقاري</div>
              <div className="text-slate-400">هاتف: 0501234567 | الرياض - حي الصحافة</div>
              <div className="text-slate-400">اسم المستلم: المهندس خالد المطيري</div>
            </div>

            <div className="bg-slate-950 border border-slate-800 p-4 rounded-xl space-y-1">
              <span className="text-slate-400 font-bold block">بيانات المورد (Seller Details)</span>
              <div className="text-white font-bold">مؤسسة توريدات الشرق للصناعة</div>
              <div className="text-slate-400">سجل تجاري: 1010998877 | ضريبة: 300099887700003</div>
              <div className="text-slate-400">هاتف التنسيق: 0559988776</div>
            </div>
          </div>
        </div>

        {/* Fulfillment Lifecycle Steps */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-6">
          <h2 className="text-sm font-bold text-white">مراحل التوصيل والضمان الحالية</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-xs">
            <div className={`p-4 rounded-xl border ${dealState === 'INVOICE' ? 'bg-indigo-600/20 border-indigo-500 text-indigo-300' : 'bg-slate-950 border-slate-800 text-slate-400'}`}>
              <div className="font-bold">1. إصدار الفاتورة</div>
              <div className="text-[10px] mt-1">تمت الموافقة وكشف البيانات</div>
            </div>

            <div className={`p-4 rounded-xl border ${dealState === 'SHIPPED' ? 'bg-indigo-600/20 border-indigo-500 text-indigo-300' : 'bg-slate-950 border-slate-800 text-slate-400'}`}>
              <div className="font-bold">2. الشحن والتجميع</div>
              <div className="text-[10px] mt-1">الشحنة بالحرية رقم #TRK-9900</div>
            </div>

            <div className={`p-4 rounded-xl border ${dealState === 'DELIVERED' ? 'bg-emerald-600/20 border-emerald-500 text-emerald-300' : 'bg-slate-950 border-slate-800 text-slate-400'}`}>
              <div className="font-bold">3. تأكيد الاستلام</div>
              <div className="text-[10px] mt-1">مطابقة الفاتورة مع المستلم</div>
            </div>

            <div className={`p-4 rounded-xl border ${dealState === 'WARRANTY' ? 'bg-amber-600/20 border-amber-500 text-amber-300' : 'bg-slate-950 border-slate-800 text-slate-400'}`}>
              <div className="font-bold">4. فحص الضمان والمرتجعات</div>
              <div className="text-[10px] mt-1">فتح مطالعة الضمان أو إغلاق الصفقة</div>
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-slate-800">
            <Button onClick={() => setDealState('DELIVERED')} className="bg-emerald-600 hover:bg-emerald-500 text-white text-xs px-6 font-bold">
              تأكيد استلام الطلب من المشتري (Confirm Receipt)
            </Button>
          </div>
        </div>

      </div>
    </div>
  );
};
