import React, { useState } from 'react';
import { Button } from '../../components/common/Button';

export const AgentMarketplace = () => {
  const [activeCategory, setActiveCategory] = useState('ALL');
  const [agents, setAgents] = useState([
    { id: 'agent-sap-erp', name: 'SAP ERP Integration Agent', category: 'ERP', author: 'SAP Partner Labs', priceMonthly: 199, installedCount: 42, rating: 4.9, isInstalled: true, description: 'مزامنة طلبات الشراء وأوامر التوريد مباشرة مع نظام SAP S/4HANA.' },
    { id: 'agent-oracle-fin', name: 'Oracle Financials Agent', category: 'FINANCE', author: 'Oracle Ecosystem', priceMonthly: 149, installedCount: 35, rating: 4.8, isInstalled: false, description: 'أتمتة مطابقة الفواتير والتحقق من الميزانيات مع Oracle Cloud Financials.' },
    { id: 'agent-customs-zatca', name: "Saudi ZATCA & Customs Agent", category: 'COMPLIANCE', author: 'KSA Legal Tech', priceMonthly: 99, installedCount: 128, rating: 5.0, isInstalled: true, description: 'الامتثال الكامل لمتطلبات الفوترة الإلكترونية (هيأة الزكاة والضريبة والجمارك).' },
    { id: 'agent-aramco-spec', name: 'Aramco Standards Agent', category: 'ENERGY', author: 'Industrial AI Solutions', priceMonthly: 299, installedCount: 18, rating: 4.9, isInstalled: false, description: 'مطابقة المواصفات الفنية والموارد طبقاً لمعايير أرامكو السعودية (SAMSS).' }
  ]);

  const handleToggleInstall = (id) => {
    setAgents(prev => prev.map(a => a.id === id ? { ...a, isInstalled: !a.isInstalled } : a));
  };

  const categories = ['ALL', 'ERP', 'FINANCE', 'COMPLIANCE', 'ENERGY'];
  const filteredAgents = activeCategory === 'ALL' ? agents : agents.filter(a => a.category === activeCategory);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans p-6">
      <div className="max-w-[1600px] mx-auto space-y-6">
        
        {/* Header */}
        <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl shadow-xl flex flex-wrap justify-between items-center gap-6">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-indigo-600 flex items-center justify-center font-black text-2xl shadow-lg shadow-indigo-500/20">
              🏪
            </div>
            <div>
              <div className="flex items-center gap-3">
                <h1 className="text-xl font-black text-white">متجر الوكلاء الذكيين (Agent Marketplace & App Store)</h1>
                <span className="bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 text-xs px-3 py-0.5 rounded-full font-mono font-bold">
                  Enterprise Store
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-1">تصفح وتثبيت الوكلاء المتخصصين والإضافات المؤسسية المعتمدة لشركتك بنقرة واحدة.</p>
            </div>
          </div>

          <Button className="bg-indigo-600 hover:bg-indigo-500 font-bold text-xs px-6">
            + رفع وكيل جديد كـ Developer 🚀
          </Button>
        </div>

        {/* Category Filters */}
        <div className="flex gap-2 border-b border-slate-800 pb-4 overflow-x-auto">
          {categories.map(cat => (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat)}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition ${
                activeCategory === cat ? 'bg-indigo-600 text-white' : 'bg-slate-900 text-slate-400 hover:bg-slate-800'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Agent Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {filteredAgents.map(agent => (
            <div key={agent.id} className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-lg flex flex-col justify-between space-y-4 hover:border-slate-700 transition">
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-[10px] font-mono font-bold bg-slate-800 text-indigo-300 px-2.5 py-0.5 rounded border border-slate-700">
                    {agent.category}
                  </span>
                  <span className="text-xs font-bold text-amber-400 flex items-center gap-1">
                    ★ {agent.rating}
                  </span>
                </div>
                <h3 className="font-bold text-sm text-white">{agent.name}</h3>
                <p className="text-xs text-slate-400 line-clamp-3">{agent.description}</p>
              </div>

              <div className="space-y-3 pt-3 border-t border-slate-800/80">
                <div className="flex justify-between items-center text-xs">
                  <span className="text-slate-500 font-mono text-[11px]">{agent.author}</span>
                  <span className="font-mono text-emerald-400 font-bold">${agent.priceMonthly}/شهر</span>
                </div>

                <Button
                  onClick={() => handleToggleInstall(agent.id)}
                  className={`w-full text-xs font-bold py-2.5 rounded-xl transition ${
                    agent.isInstalled 
                      ? 'bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700' 
                      : 'bg-indigo-600 hover:bg-indigo-500 text-white'
                  }`}
                >
                  {agent.isInstalled ? 'مثبت (Installed ✅)' : 'تثبيت الوكيل (Install 📥)'}
                </Button>
              </div>
            </div>
          ))}
        </div>

      </div>
    </div>
  );
};
