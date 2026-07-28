import React, { useState } from 'react';
import { Button } from '../../components/common/Button';

export const SovereignOperationalConsole = () => {
  const [killSwitchActive, setKillSwitchActive] = useState(false);
  const [agentsLifecycle, setAgentsLifecycle] = useState([
    { name: 'Commercial Procurement Agent', status: 'RUNNING', promptVer: 'v4.0.0', latencyMs: 140, callsCount: 1240 },
    { name: 'Finance & Invoice Agent', status: 'SLEEPING', promptVer: 'v2.1.0', latencyMs: 95, callsCount: 520 },
    { name: 'Market Risk & Fraud Agent', status: 'RUNNING', promptVer: 'v3.0.0', latencyMs: 110, callsCount: 890 }
  ]);

  const handleToggleKillSwitch = () => {
    setKillSwitchActive(!killSwitchActive);
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans p-6">
      <div className="max-w-[1600px] mx-auto space-y-6">
        
        {/* Header */}
        <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl shadow-xl flex flex-wrap justify-between items-center gap-6">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-indigo-600 flex items-center justify-center font-black text-2xl shadow-lg shadow-indigo-500/20">
              🛡️
            </div>
            <div>
              <div className="flex items-center gap-3">
                <h1 className="text-xl font-black text-white">مركز العمليات والمراقبة السيادية (Sovereign Operational Console)</h1>
                <span className={`text-xs px-3 py-0.5 rounded-full font-mono font-bold border ${
                  killSwitchActive ? 'bg-red-500/20 text-red-300 border-red-500/30' : 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30'
                }`}>
                  {killSwitchActive ? '⚠️ EMERGENCY DISASTER SHUTDOWN ACTIVE' : '● ALL SYSTEMS OPERATIONAL'}
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-1">إدارة دورة حياة الوكلاء، الأسرار، الميزانيات، المجموعات، وزر الإيقاف الكارثي الفوري.</p>
            </div>
          </div>

          {/* Master Disaster Kill Switch */}
          <Button
            onClick={handleToggleKillSwitch}
            className={`px-6 py-3 font-bold text-xs shadow-xl transition rounded-xl ${
              killSwitchActive ? 'bg-emerald-600 hover:bg-emerald-500 text-white' : 'bg-red-600 hover:bg-red-500 text-white animate-pulse'
            }`}
          >
            {killSwitchActive ? '✅ إعادة تشغيل المنظومة (Reset AI System)' : '🚨 زر الإيقاف الكارثي الفوري (EMERGENCY AI OFF)'}
          </Button>
        </div>

        {/* Operational Dashboard Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* Agent Observability & Lifecycle Card */}
          <div className="lg:col-span-2 bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4 shadow-xl">
            <h2 className="text-sm font-bold text-slate-300">مراقبة الأداء ودورة الحياة (Agent Observability & Lifecycle)</h2>
            
            <div className="space-y-3">
              {agentsLifecycle.map((a, idx) => (
                <div key={idx} className="bg-slate-950 p-4 rounded-xl border border-slate-800 flex justify-between items-center text-xs">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <strong className="text-white font-bold">{a.name}</strong>
                      <span className="text-[10px] font-mono bg-slate-800 text-indigo-300 px-2 py-0.5 rounded border border-slate-700">
                        {a.promptVer}
                      </span>
                    </div>
                    <span className="text-slate-400 text-[11px]">الاستدعاءات: {a.callsCount} | زمن الاستجابة: {a.latencyMs}ms</span>
                  </div>

                  <span className={`text-[10px] font-mono font-bold px-3 py-1 rounded-full border ${
                    a.status === 'RUNNING' ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30' : 'bg-amber-500/20 text-amber-300 border-amber-500/30'
                  }`}>
                    {a.status}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Secrets Vault Status Card */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4 shadow-xl">
            <h2 className="text-sm font-bold text-slate-300">خزنة الأسرار والمفاتيح (Owner Secrets Vault)</h2>
            
            <div className="space-y-2 text-xs">
              <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 flex justify-between items-center">
                <span className="text-slate-300 font-bold">OpenAI API Key</span>
                <span className="text-emerald-400 font-mono">sk-proj-****84</span>
              </div>
              <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 flex justify-between items-center">
                <span className="text-slate-300 font-bold">Claude API Key</span>
                <span className="text-emerald-400 font-mono">sk-ant-****19</span>
              </div>
              <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 flex justify-between items-center">
                <span className="text-slate-300 font-bold">WhatsApp Token</span>
                <span className="text-emerald-400 font-mono">EAAG****02</span>
              </div>
            </div>

            <Button className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs py-2.5 rounded-xl">
              تحديث الأسرار والمفاتيح 🔑
            </Button>
          </div>

        </div>

      </div>
    </div>
  );
};
