import React, { useState } from 'react';

export const RightAssistant = ({ events = [], aiSuggestions = [] }) => {
  const [activeRightTab, setActiveRightTab] = useState('activity'); // 'activity' | 'ai'

  const mockGitHubTimeline = [
    { time: '10:05', event: 'تم اعتماد القبول والترسية لحزمة Steel Works', author: 'المشتري الرئيسي', type: 'AWARD' },
    { time: '09:35', event: 'إرسال عرض مقابل بسعر 115,000 ريال', author: 'المشتري', type: 'COUNTER' },
    { time: '09:20', event: 'فتح واستعراض تفاصيل العرض الأخير', author: 'المشتري', type: 'VIEW' },
    { time: '09:15', event: 'مورد مواد البناء أرسل عرض أسعار جديد', author: 'المورد A', type: 'PROPOSAL' }
  ];

  const timelineItems = events.length > 0 ? events : mockGitHubTimeline;

  return (
    <aside className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm space-y-5 flex flex-col h-full sticky top-20">
      {/* Panel Top Navigation */}
      <div className="flex border-b border-gray-100 pb-3 gap-2 overflow-x-auto">
        <button
          onClick={() => setActiveRightTab('activity')}
          className={`flex-1 py-1.5 text-xs font-bold rounded transition ${
            activeRightTab === 'activity'
              ? 'bg-indigo-600 text-white'
              : 'text-gray-500 hover:bg-gray-100'
          }`}
        >
          📜 السجل الزمني (GitHub Stream)
        </button>
        <button
          onClick={() => setActiveRightTab('ai')}
          className={`flex-1 py-1.5 text-xs font-bold rounded transition ${
            activeRightTab === 'ai'
              ? 'bg-indigo-600 text-white'
              : 'text-gray-500 hover:bg-gray-100'
          }`}
        >
          🤖 الذكاء (AI Alerts)
        </button>
      </div>

      {/* Tab 1: GitHub-Style Story Timeline */}
      {activeRightTab === 'activity' && (
        <div className="space-y-4 flex-1 overflow-y-auto max-h-[600px]">
          <h3 className="font-bold text-gray-900 text-xs uppercase tracking-wider">سجل التطور التفرعي للمشروع</h3>
          
          <div className="space-y-4 relative border-r-2 border-indigo-200 pr-4 mr-2">
            {timelineItems.map((evt, idx) => (
              <div key={idx} className="relative text-xs space-y-1">
                {/* Timeline Bullet */}
                <span className="absolute -right-[23px] top-0 w-3.5 h-3.5 rounded-full bg-indigo-600 border-2 border-white shadow-sm"></span>

                <div className="flex justify-between items-center">
                  <span className="font-mono text-[11px] font-bold text-indigo-600">
                    {evt.time || (evt.timestamp ? new Date(evt.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'الآن')}
                  </span>
                  {evt.author && <span className="text-[10px] bg-gray-100 px-1.5 py-0.5 rounded text-gray-600">{evt.author}</span>}
                </div>

                <p className="font-medium text-gray-800 leading-snug">
                  {evt.event}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tab 2: Proactive AI Guidance & Trade-offs */}
      {activeRightTab === 'ai' && (
        <div className="space-y-3 flex-1 overflow-y-auto">
          <h3 className="font-bold text-gray-900 text-xs uppercase tracking-wider">التوصيات والتوجيهات الحية</h3>
          
          <div className="space-y-3">
            <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-3.5 text-xs text-emerald-900 space-y-1 shadow-sm">
              <strong className="font-bold block text-emerald-950">💡 توصية توفير الميزانية:</strong>
              <p className="leading-relaxed">إذا اعتمدت Concrete Works اليوم ستوفر 45,000 ريال مقارنة بالعرض الثاني.</p>
            </div>
            
            <div className="bg-amber-50 border border-amber-200 rounded-xl p-3.5 text-xs text-amber-900 space-y-1 shadow-sm">
              <strong className="font-bold block text-amber-950">⚠️ تنبيه موعد انتهاء RFQ:</strong>
              <p className="leading-relaxed">بقي يومان على صلاحية العروض المقدمة بحزمة Steel Works.</p>
            </div>
          </div>
        </div>
      )}
    </aside>
  );
};
