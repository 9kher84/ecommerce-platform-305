import React, { useState } from 'react';

export const PackageAccordion = ({ workPackages = [], onSelectProcess }) => {
  const [expandedPackageIds, setExpandedPackageIds] = useState([]);

  const togglePackage = (id) => {
    setExpandedPackageIds(prev =>
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    );
  };

  if (!workPackages || workPackages.length === 0) {
    return (
      <div className="bg-white border border-gray-200 rounded-xl p-8 text-center text-gray-500">
        لا توجد حزم عمل مسجلة في هذا المشروع حالياً.
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {workPackages.map((wp) => {
        const isExpanded = expandedPackageIds.includes(wp.id);
        const processes = wp.commercialProcesses || [];
        const processCount = processes.length;
        const isAwarded = wp.status === 'awarded' || processes.some(p => ['awarded', 'pending_award'].includes(p.status));

        // Calculate lowest and highest prices from negotiation sheets
        const allPrices = processes.flatMap(p => 
          (p.negotiationSheets || []).map(s => parseFloat(s.terms?.price || s.terms?.grandTotal || 0))
        ).filter(price => price > 0);

        const lowestPrice = allPrices.length > 0 ? Math.min(...allPrices) : null;
        const highestPrice = allPrices.length > 0 ? Math.max(...allPrices) : null;

        return (
          <div 
            key={wp.id} 
            className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden transition hover:border-gray-300"
          >
            {/* Package Mini-Dashboard Header */}
            <div 
              onClick={() => togglePackage(wp.id)}
              className="p-5 flex flex-wrap justify-between items-center cursor-pointer hover:bg-gray-50/80 transition border-b border-transparent gap-4"
            >
              <div className="flex items-center gap-3">
                <span className="text-indigo-600 font-bold text-sm">{isExpanded ? '▼' : '◀'}</span>
                <div>
                  <h4 className="font-bold text-lg text-gray-900">{wp.name}</h4>
                  <p className="text-xs text-gray-500 mt-0.5">{wp.description || 'لا يوجد وصف مضاف.'}</p>
                </div>
              </div>

              {/* 🔥 Package Mini-Dashboard Indicators (Pre-collapse Summary) */}
              <div className="flex flex-wrap items-center gap-3">
                <div className="bg-gray-100 px-3 py-1.5 rounded-lg text-xs font-bold text-gray-700 flex items-center gap-1.5">
                  <span>🏬 الموردين:</span>
                  <strong className="text-indigo-600">{processCount}</strong>
                </div>

                {lowestPrice && (
                  <div className="bg-emerald-50 border border-emerald-200 px-3 py-1.5 rounded-lg text-xs font-bold text-emerald-800">
                    أقل سعر: <strong>{lowestPrice.toLocaleString()} ريال</strong>
                  </div>
                )}

                {highestPrice && highestPrice !== lowestPrice && (
                  <div className="bg-gray-50 border border-gray-200 px-3 py-1.5 rounded-lg text-xs font-bold text-gray-600">
                    أعلى سعر: <strong>{highestPrice.toLocaleString()} ريال</strong>
                  </div>
                )}

                <span className={`px-3 py-1.5 rounded-lg text-xs font-bold ${
                  isAwarded 
                    ? 'bg-green-100 text-green-800 border border-green-300' 
                    : 'bg-amber-100 text-amber-900 border border-amber-300 animate-pulse'
                }`}>
                  {isAwarded ? '🏆 تم الترسية' : '⚡ يحتاج قراراً'}
                </span>
              </div>
            </div>

            {/* Nested Suppliers & Proposals (Progressive Disclosure) */}
            {isExpanded && (
              <div className="bg-gray-50/70 border-t border-gray-100 p-5 space-y-3">
                <h5 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">عروض الموردين الجارية ومقارنة الخيارات:</h5>
                
                {processes.length === 0 ? (
                  <div className="bg-white border border-dashed border-gray-300 rounded-lg p-5 text-center text-xs text-gray-500">
                    لم يتم تقديم أي عروض أسعار لهذه الحزمة بعد.
                  </div>
                ) : (
                  <div className="space-y-3">
                    {processes.map((proc) => {
                      const party = proc.parties?.find(p => p.partyRole === 'SELLER');
                      const sellerName = party?.user?.name || party?.organization?.name || `مورد (عملية #${proc.id.substring(0,6)})`;
                      const sheets = proc.negotiationSheets || [];
                      const latestSheet = sheets[sheets.length - 1];
                      const currentPrice = latestSheet?.terms?.price || latestSheet?.terms?.grandTotal;

                      return (
                        <div 
                          key={proc.id} 
                          onClick={() => onSelectProcess && onSelectProcess(proc, wp)}
                          className="bg-white border border-gray-200 rounded-xl p-4 flex flex-wrap justify-between items-center hover:border-indigo-500 hover:shadow-md cursor-pointer transition gap-3"
                        >
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full bg-indigo-50 text-indigo-700 flex items-center justify-center font-bold text-sm border border-indigo-100">
                              🏪
                            </div>
                            <div>
                              <h6 className="font-bold text-sm text-gray-900">{sellerName}</h6>
                              <span className="text-xs text-gray-500 font-mono">الحالة: {proc.status}</span>
                            </div>
                          </div>

                          <div className="flex items-center gap-4">
                            {currentPrice && (
                              <div className="text-right">
                                <span className="text-[10px] text-gray-400 font-bold block">العرض الأخير</span>
                                <span className="text-base font-black text-indigo-600">{currentPrice.toLocaleString()} ريال</span>
                              </div>
                            )}
                            <span className="px-3 py-1.5 bg-indigo-600 text-white rounded-lg text-xs font-bold hover:bg-indigo-700 transition">
                              استعراض التفاصيل والترسية ❯
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
};
