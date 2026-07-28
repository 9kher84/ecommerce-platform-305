import React from 'react';
import { Button } from '../common/Button';

export const CommandCenter = ({ actions = [], onActionClick }) => {
  if (!actions || actions.length === 0) {
    return (
      <div className="bg-gradient-to-r from-emerald-50 to-teal-50 border border-emerald-200 rounded-xl p-4 text-emerald-800 text-sm flex items-center justify-between shadow-sm">
        <div className="flex items-center gap-2">
          <span className="text-xl">✨</span>
          <div>
            <strong className="font-bold">مركز القيادة:</strong> جميع قرارات مساحة العمل مستقرة ولا توجد إجراءات عاجلة مطلوبة حالياً.
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-gradient-to-r from-indigo-900 to-slate-900 text-white rounded-xl p-5 shadow-lg space-y-3">
      <div className="flex justify-between items-center border-b border-indigo-800/60 pb-3">
        <div className="flex items-center gap-2">
          <span className="text-xl">⚡</span>
          <h2 className="font-black text-lg text-amber-400">مركز القرارات والقيادة (Command Center)</h2>
        </div>
        <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-400/20 text-amber-300 border border-amber-400/30">
          {actions.length} قرارات تتطلب حسمك
        </span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 pt-1">
        {actions.map((act, idx) => (
          <div key={idx} className="bg-indigo-950/70 border border-indigo-700/50 rounded-lg p-4 flex flex-col justify-between space-y-3 hover:border-amber-400/50 transition">
            <div>
              <div className="flex justify-between items-start mb-1">
                <span className="text-xs font-mono text-amber-300 font-bold">{act.type || 'إجراء'}</span>
                <span className="text-xs text-indigo-300">{act.time || 'الآن'}</span>
              </div>
              <h4 className="font-bold text-sm text-gray-100 line-clamp-1">{act.title}</h4>
              <p className="text-xs text-gray-400 mt-1">{act.description}</p>
            </div>
            <Button size="sm" onClick={() => onActionClick && onActionClick(act)}>
              {act.actionLabel || 'اتخاذ القرار ❯'}
            </Button>
          </div>
        ))}
      </div>
    </div>
  );
};
