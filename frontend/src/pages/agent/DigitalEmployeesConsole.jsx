import React, { useState } from 'react';
import { Button } from '../../components/common/Button';

export const DigitalEmployeesConsole = () => {
  const [employees, setEmployees] = useState([
    { id: 1, name: 'Commercial Procurement Officer AI', role: 'Procurement Specialist', category: 'PROCUREMENT', status: 'ACTIVE', confidence: 95, version: 'v2.0.0', tasksHandled: 1420, icon: '🛒', description: 'إدارة طلبات الشراء واستكشاف الموردين ومقارنة العروض التجارية وتوصيات الترسية.' },
    { id: 2, name: 'Finance & Budget Officer AI', role: 'Financial Auditor', category: 'FINANCE', status: 'ACTIVE', confidence: 98, version: 'v2.0.0', tasksHandled: 890, icon: '💳', description: 'مطابقة الفواتير الثلاثية، التدقيق في حدود الصرف، والامتثال الضريبي (ZATCA).' },
    { id: 3, name: 'Logistics & Fulfillment Officer AI', role: 'Logistics Specialist', category: 'LOGISTICS', status: 'ACTIVE', confidence: 93, version: 'v2.0.0', tasksHandled: 640, icon: '🚚', description: 'تتبع الشحنات، رصد المهل الزمنية، وإدارة مؤشرات إخلال الاتفاقيات (SLA Breaches).' },
    { id: 4, name: 'Commercial Sales Officer AI', role: 'Sales Specialist', category: 'SALES', status: 'ACTIVE', confidence: 91, version: 'v2.0.0', tasksHandled: 1150, icon: '📈', description: 'صياغة العروض المباشرة للعملاء، حساب احتمالات الفوز بالصفقة، واستراتيجيات التفاوض.' },
    { id: 5, name: 'Chief Executive Officer AI (CEO)', role: 'Executive Orchestrator', category: 'EXECUTIVE', status: 'ACTIVE', confidence: 99, version: 'v2.0.0', tasksHandled: 3100, icon: '👑', description: 'إدارة وتنسيق التعاون بين كافة الوكلاء، مراجعة المخاطر الكلية، والاعتمادات السيادية.' }
  ]);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans p-6">
      <div className="max-w-[1600px] mx-auto space-y-6">
        
        {/* Header */}
        <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl shadow-xl flex flex-wrap justify-between items-center gap-6">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-indigo-600 flex items-center justify-center font-black text-2xl shadow-lg shadow-indigo-500/20">
              👔
            </div>
            <div>
              <div className="flex items-center gap-3">
                <h1 className="text-xl font-black text-white">سجل الموظفين الرقميين المتخصصين (Digital Employees Roster)</h1>
                <span className="bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-xs px-3 py-0.5 rounded-full font-mono font-bold">
                  Agent OS V2 Certified
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-1">كادر الموظفين الرقميين المتخصصين لإدارة قطاعات الشراء، المالية، اللوجستيات، والمبيعات بكفاءة وتكامل مع الحوكمة.</p>
            </div>
          </div>

          <Button className="bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs px-6">
            + إضافة موظف رقمي مخصص (Add Digital Officer)
          </Button>
        </div>

        {/* Employees Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {employees.map(emp => (
            <div key={emp.id} className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4 hover:border-slate-700 transition">
              
              <div className="flex justify-between items-start">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-center text-xl">
                    {emp.icon}
                  </div>
                  <div>
                    <h3 className="font-bold text-sm text-white">{emp.name}</h3>
                    <span className="text-[11px] text-indigo-400 font-bold block">{emp.role}</span>
                  </div>
                </div>

                <span className="bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-[10px] font-mono px-2 py-0.5 rounded">
                  {emp.status}
                </span>
              </div>

              <p className="text-xs text-slate-400 line-clamp-2">{emp.description}</p>

              <div className="pt-3 border-t border-slate-800/80 flex justify-between items-center text-xs">
                <div className="space-y-0.5">
                  <span className="text-[10px] text-slate-500 block">العمليات المنجزة</span>
                  <strong className="text-white font-mono">{emp.tasksHandled}</strong>
                </div>

                <div className="space-y-0.5 text-right">
                  <span className="text-[10px] text-slate-500 block">نسبة الثقة (Confidence)</span>
                  <strong className="text-emerald-400 font-mono font-black">{emp.confidence}%</strong>
                </div>
              </div>

            </div>
          ))}
        </div>

      </div>
    </div>
  );
};
