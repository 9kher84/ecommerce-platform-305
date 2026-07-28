import React, { useState } from 'react';
import { Button } from '../../components/common/Button';

export const AiPlatformConsole = () => {
  // Sovereign Platform Launch State
  const [platformState, setPlatformState] = useState({
    status: 'DORMANT', // 'DORMANT' | 'INTERNAL_STAGING' | 'BETA_ORGS' | 'PREMIUM' | 'GLOBAL_LAUNCH'
    rolloutStage: 'Stage 1: Internal Staging (1 Org)',
    isAgentOsActive: false
  });

  // Feature Flags State
  const [featureFlags, setFeatureFlags] = useState({
    reasoningEngine: true,
    memoryRetention: 'PERMANENT',
    eventBus: 'INTERNAL',
    whatsappChannel: true,
    emailChannel: true,
    teamsChannel: false,
    autoApprovalLimit: 20000
  });

  // LLM Providers State
  const [providers, setProviders] = useState([
    { name: 'OpenAI', model: 'GPT-4o / GPT-5', status: 'CONNECTED', dailyBudget: '$50', todaySpent: '$3.70', isPrimary: true },
    { name: 'Anthropic Claude', model: 'Claude 3.5 Sonnet', status: 'CONNECTED', dailyBudget: '$30', todaySpent: '$1.20', isPrimary: false },
    { name: 'Google Gemini', model: 'Gemini 1.5 Pro', status: 'CONNECTED', dailyBudget: '$20', todaySpent: '$0.80', isPrimary: false },
    { name: 'Local Llama-3', model: 'Llama-3 70B (On-Prem)', status: 'STANDBY', dailyBudget: '$0', todaySpent: '$0.00', isPrimary: false }
  ]);

  // Agents Management State
  const [agents, setAgents] = useState([
    { name: 'Chief Executive Agent', role: 'Orchestrator', status: 'RUNNING', provider: 'OpenAI' },
    { name: 'Commercial Procurement Agent', role: 'RFQ & Negotiation', status: 'RUNNING', provider: 'Claude' },
    { name: 'Finance & Invoice Agent', role: 'Invoice Validation', status: 'RUNNING', provider: 'Gemini' },
    { name: 'Market Risk & Fraud Agent', role: 'Compliance Audit', status: 'RUNNING', provider: 'OpenAI' }
  ]);

  const handleLaunchAgentOs = () => {
    setPlatformState(prev => ({
      ...prev,
      isAgentOsActive: !prev.isAgentOsActive,
      status: !prev.isAgentOsActive ? 'INTERNAL_STAGING' : 'DORMANT'
    }));
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans p-6">
      <div className="max-w-[1600px] mx-auto space-y-6">
        
        {/* Sovereign Header */}
        <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl shadow-xl flex flex-wrap justify-between items-center gap-6">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-indigo-600 flex items-center justify-center font-black text-2xl shadow-lg shadow-indigo-500/20">
              ⚡
            </div>
            <div>
              <div className="flex items-center gap-3">
                <h1 className="text-xl font-black text-white">لوحة تحكم وإطلاق نظام تشغيل الوكلاء (Sovereign AI Platform Console)</h1>
                <span className={`text-xs px-3 py-0.5 rounded-full font-mono font-bold border ${
                  platformState.isAgentOsActive 
                    ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30' 
                    : 'bg-amber-500/20 text-amber-300 border-amber-500/30'
                }`}>
                  ● {platformState.isAgentOsActive ? 'ACTIVE ROLLOUT' : 'DORMANT (خامل)'}
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-1">التحكم السيادي المباشر في الميزانيات، المزودين، القنوات، ونسبة تفعيل Agent OS على مستوى المنصة.</p>
            </div>
          </div>

          {/* Master Launch Toggle */}
          <div className="flex items-center gap-4">
            <div className="text-right">
              <span className="text-[10px] text-slate-400 font-bold block">مرحلة التدرج (Rollout Stage)</span>
              <span className="text-xs text-indigo-400 font-mono font-bold">{platformState.rolloutStage}</span>
            </div>
            <Button 
              onClick={handleLaunchAgentOs} 
              className={`px-6 py-3 font-bold text-xs shadow-xl transition rounded-xl ${
                platformState.isAgentOsActive 
                  ? 'bg-red-600 hover:bg-red-500 text-white' 
                  : 'bg-emerald-600 hover:bg-emerald-500 text-white animate-pulse'
              }`}
            >
              {platformState.isAgentOsActive ? '🛑 إيقاف Agent OS (Deactivate)' : '🚀 إطلاق Agent OS (Launch Platform)'}
            </Button>
          </div>
        </div>

        {/* Console Dashboard Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* LLM Provider Management */}
          <div className="lg:col-span-2 bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4 shadow-xl">
            <div className="flex justify-between items-center border-b border-slate-800 pb-3">
              <h2 className="text-sm font-bold text-white flex items-center gap-2">
                <span>🧠</span> إدارة المزودين والميزانيات (LLM Providers & Cost Control)
              </h2>
              <span className="text-xs font-mono text-emerald-400 font-bold">إجمالي اليوم: $5.70</span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {providers.map((p, idx) => (
                <div key={idx} className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-3">
                  <div className="flex justify-between items-center">
                    <strong className="text-white text-sm font-bold">{p.name}</strong>
                    <span className="text-[10px] font-mono font-bold bg-emerald-500/20 text-emerald-300 px-2 py-0.5 rounded border border-emerald-500/30">
                      {p.status}
                    </span>
                  </div>
                  <div className="text-xs space-y-1 text-slate-300">
                    <div className="flex justify-between"><span className="text-slate-400">النموذج:</span><span className="font-mono">{p.model}</span></div>
                    <div className="flex justify-between"><span className="text-slate-400">السقف اليومي:</span><span className="font-mono">{p.dailyBudget}</span></div>
                    <div className="flex justify-between"><span className="text-slate-400">مستهلك اليوم:</span><span className="font-mono text-amber-400 font-bold">{p.todaySpent}</span></div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Feature Flags & Control Switches */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4 shadow-xl">
            <h2 className="text-sm font-bold text-white border-b border-slate-800 pb-3 flex items-center gap-2">
              <span>⚙️</span> مفاتيح الخصائص (Feature Flags)
            </h2>

            <div className="space-y-3 text-xs">
              <div className="flex justify-between items-center bg-slate-950 p-3 rounded-xl border border-slate-800">
                <span className="text-slate-300 font-bold">Reasoning Engine</span>
                <span className="text-emerald-400 font-mono font-bold">ENABLED</span>
              </div>
              <div className="flex justify-between items-center bg-slate-950 p-3 rounded-xl border border-slate-800">
                <span className="text-slate-300 font-bold">Memory Retention</span>
                <span className="text-purple-400 font-mono font-bold">PERMANENT</span>
              </div>
              <div className="flex justify-between items-center bg-slate-950 p-3 rounded-xl border border-slate-800">
                <span className="text-slate-300 font-bold">Event Bus Reactive</span>
                <span className="text-indigo-400 font-mono font-bold">INTERNAL</span>
              </div>
              <div className="flex justify-between items-center bg-slate-950 p-3 rounded-xl border border-slate-800">
                <span className="text-slate-300 font-bold">WhatsApp Ingress</span>
                <span className="text-emerald-400 font-mono font-bold">ACTIVE</span>
              </div>
              <div className="flex justify-between items-center bg-slate-950 p-3 rounded-xl border border-slate-800">
                <span className="text-slate-300 font-bold">Email Mail Parser</span>
                <span className="text-emerald-400 font-mono font-bold">ACTIVE</span>
              </div>
            </div>
          </div>

        </div>

      </div>
    </div>
  );
};
