import React, { useState } from 'react';
import { Button } from '../../components/common/Button';
import { ProductIngressModal } from '../product/ProductIngressModal';

export const SellerPlatformConsole = () => {
  const [activeModule, setActiveModule] = useState('TODAY_BUSINESS');
  const [isAddProductOpen, setIsAddProductOpen] = useState(false);
  
  // Simulated dynamic capability state from SellerCapabilityEngine
  const [capabilities] = useState({
    tier: 'PRO',
    enabledModules: [
      'TODAY_BUSINESS',
      'PURCHASE_OPPORTUNITIES',
      'QUOTATIONS',
      'ORDERS_AND_FULFILLMENT',
      'PRODUCTS_INGRESS',
      'INVENTORY',
      'CUSTOMER_DEALS',
      'FINANCE',
      'PERFORMANCE_METRICS',
      'REPORTS',
      'AI_INTELLIGENCE',
      'SETTINGS'
    ]
  });

  const navItems = [
    { id: 'TODAY_BUSINESS', label: "إنجازات اليوم (Today's Business)", icon: '⚡' },
    { id: 'PURCHASE_OPPORTUNITIES', label: 'فرص الشراء (RFQs)', icon: '🎯' },
    { id: 'QUOTATIONS', label: 'العروض والمفاوضات (Quotes)', icon: '📝' },
    { id: 'ORDERS_AND_FULFILLMENT', label: 'الطلبات والشحن (Orders)', icon: '📦' },
    { id: 'PRODUCTS_INGRESS', label: 'إدارة المنتجات (Products)', icon: '🏷️' },
    { id: 'INVENTORY', label: 'المخزون (Inventory)', icon: '🏢' },
    { id: 'FINANCE', label: 'المالية والعمولات (Finance)', icon: '💳' },
    { id: 'PERFORMANCE_METRICS', label: 'الأداء الفعلي (Performance)', icon: '📊' },
    { id: 'AI_INTELLIGENCE', label: 'ذكاء السوق (AI Engine)', icon: '🤖' },
    { id: 'SETTINGS', label: 'الإعدادات (Settings)', icon: '⚙️' }
  ].filter(item => capabilities.enabledModules.includes(item.id));

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans flex flex-col">
      
      {/* Top Header Navigation */}
      <header className="bg-slate-900 border-b border-slate-800 px-6 py-4 flex flex-wrap justify-between items-center gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-indigo-600 flex items-center justify-center font-bold text-lg shadow-lg shadow-indigo-500/20">
            🏬
          </div>
          <div>
            <h1 className="font-black text-sm text-white">منصة البائع الذكية (Seller Capability Platform)</h1>
            <span className="text-[11px] text-slate-400">نظام التشغيل المتقدم للبائعين والتجار والمصانع</span>
          </div>
        </div>

        <div className="flex items-center gap-3 text-xs">
          <span className="bg-indigo-500/10 text-indigo-300 border border-indigo-500/20 px-3 py-1 rounded-full font-mono font-bold">
            {capabilities.tier} TIER
          </span>
          <span className="bg-emerald-500/10 text-emerald-300 border border-emerald-500/20 px-3 py-1 rounded-full font-mono font-bold">
            Reputation: 4.85 / 5.0
          </span>
        </div>
      </header>

      {/* Main Layout Body */}
      <div className="flex-1 flex flex-col md:flex-row">
        
        {/* Sidebar Capabilities Navigation */}
        <aside className="w-full md:w-64 bg-slate-900/60 border-r border-slate-800 p-4 space-y-1">
          <div className="text-[10px] font-bold text-slate-500 uppercase px-3 py-2">الوحدات المفعلة (Capabilities)</div>
          {navItems.map(item => (
            <button
              key={item.id}
              onClick={() => setActiveModule(item.id)}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-bold transition text-right ${
                activeModule === item.id 
                  ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/20' 
                  : 'text-slate-400 hover:bg-slate-800/60 hover:text-white'
              }`}>
              <span className="text-base">{item.icon}</span>
              <span>{item.label}</span>
            </button>
          ))}
        </aside>

        {/* Dynamic Capability Module Body */}
        <main className="flex-1 p-6 bg-slate-950 overflow-y-auto">
          <div className="flex justify-end mb-4">
            <Button onClick={() => setIsAddProductOpen(true)} className="bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold px-4 py-2.5 rounded-xl shadow-lg shadow-indigo-600/20">
              + إضافة منتج ومخزون جديد
            </Button>
          </div>

          {isAddProductOpen && (
            <ProductIngressModal isOpen={isAddProductOpen} onClose={() => setIsAddProductOpen(false)} />
          )}

          {activeModule === 'TODAY_BUSINESS' && (
            <div className="space-y-6">
              <h2 className="text-lg font-black text-white">إنجازات ومهام اليوم (Today's Business Actions)</h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="bg-slate-900 border border-slate-800 p-4 rounded-2xl space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-[11px] text-slate-400">فرص شراء جديدة</span>
                    <span className="bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 text-[10px] px-2 py-0.5 rounded-full font-mono">AI MATCH: 94%</span>
                  </div>
                  <div className="text-2xl font-black text-indigo-400 font-mono">4 طلبات</div>
                  <div className="pt-2 border-t border-slate-800 flex justify-between items-center text-xs">
                    <span className="text-slate-400">توريد حديد وخراسانات</span>
                    <Button onClick={() => setActiveModule('QUOTATIONS')} className="bg-indigo-600 hover:bg-indigo-500 text-white text-[11px] px-3 py-1 font-bold">
                      تقديم عرض سعر ❯
                    </Button>
                  </div>
                </div>

                <div className="bg-slate-900 border border-slate-800 p-4 rounded-2xl space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-[11px] text-slate-400">عروض ينتظر رد البائع</span>
                    <span className="bg-amber-500/10 text-amber-400 border border-amber-500/20 text-[10px] px-2 py-0.5 rounded-full font-mono">عاجل</span>
                  </div>
                  <div className="text-2xl font-black text-amber-400 font-mono">1 عرض</div>
                  <div className="pt-2 border-t border-slate-800 flex justify-between items-center text-xs">
                    <span className="text-slate-400">مفاوضات بند السعر</span>
                    <Button onClick={() => window.location.href = '/workspace/negotiation'} className="bg-amber-600 hover:bg-amber-500 text-white text-[11px] px-3 py-1 font-bold">
                      فتح المفاوضة ❯
                    </Button>
                  </div>
                </div>

                <div className="bg-slate-900 border border-slate-800 p-4 rounded-2xl space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-[11px] text-slate-400">شحنات تحتاج تأكيد</span>
                    <span className="bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-[10px] px-2 py-0.5 rounded-full font-mono">قيد الشحن</span>
                  </div>
                  <div className="text-2xl font-black text-emerald-400 font-mono">2 شحنة</div>
                  <div className="pt-2 border-t border-slate-800 flex justify-between items-center text-xs">
                    <span className="text-slate-400">تأكيد التوريد والضمان</span>
                    <Button onClick={() => window.location.href = '/workspace/execution'} className="bg-emerald-600 hover:bg-emerald-500 text-white text-[11px] px-3 py-1 font-bold">
                      متابعة الشحن ❯
                    </Button>
                  </div>
                </div>

                <div className="bg-slate-900 border border-slate-800 p-4 rounded-2xl space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-[11px] text-slate-400">عمولة مستحقة الدفع</span>
                    <span className="bg-slate-500/10 text-slate-300 border border-slate-500/20 text-[10px] px-2 py-0.5 rounded-full font-mono">3.4% RATE</span>
                  </div>
                  <div className="text-2xl font-black text-slate-300 font-mono">SAR 3,400</div>
                  <div className="pt-2 border-t border-slate-800 flex justify-between items-center text-xs">
                    <span className="text-slate-400">حالة المستحقات: سليمة</span>
                    <Button onClick={() => window.location.href = '/merchant/passport'} className="bg-slate-800 hover:bg-slate-700 text-slate-200 text-[11px] px-3 py-1 font-bold">
                      جواز السفر ❯
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeModule === 'PERFORMANCE_METRICS' && (
            <div className="space-y-6">
              <h2 className="text-lg font-black text-white">مؤشرات الأداء الرقمية الحقيقية (Factual History Metrics)</h2>
              
              <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
                <div>
                  <span className="text-xs text-slate-400 block">الصفقات المنجزة</span>
                  <strong className="text-2xl font-black text-white font-mono">248</strong>
                </div>
                <div>
                  <span className="text-xs text-slate-400 block">عدد الإلغاءات</span>
                  <strong className="text-2xl font-black text-rose-400 font-mono">3</strong>
                </div>
                <div>
                  <span className="text-xs text-slate-400 block">سرعة الاستجابة</span>
                  <strong className="text-2xl font-black text-indigo-400 font-mono">18 دقيقة</strong>
                </div>
                <div>
                  <span className="text-xs text-slate-400 block">نسبة الالتزام بالـ SLA</span>
                  <strong className="text-2xl font-black text-emerald-400 font-mono">98.5%</strong>
                </div>
              </div>
            </div>
          )}

          {activeModule !== 'TODAY_BUSINESS' && activeModule !== 'PERFORMANCE_METRICS' && (
            <div className="bg-slate-900 border border-slate-800 p-8 rounded-2xl text-center space-y-3">
              <div className="text-3xl">⚙️</div>
              <h3 className="text-sm font-bold text-white">وحدة {activeModule} مفعلة وجاهزة بنظام الصلاحيات الديناميكي</h3>
              <p className="text-xs text-slate-400 max-w-md mx-auto">تتم إدارة ومراقبة هذه الوحدة بالكامل من محرك التحكم السيادي دون الحاجة لإعادة كتابة الكود.</p>
            </div>
          )}
        </main>

      </div>
    </div>
  );
};
