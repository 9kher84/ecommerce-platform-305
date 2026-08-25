import React, { useState } from 'react';
import { useReceiptSummary, useLogReceipt, useAcceptReceipt } from '../../hooks/queries/commercialQueries';
import { ReceiptInspectionModal } from './ReceiptInspectionModal';

export const FulfillmentSummaryCard = ({ poId }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);

  const { data: response, isLoading, isError, error } = useReceiptSummary(poId);
  const logReceiptMutation = useLogReceipt();
  const acceptReceiptMutation = useAcceptReceipt();

  if (isLoading) {
    return (
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 text-center text-slate-400 space-y-3">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-400 mx-auto"></div>
        <p className="text-xs font-bold">جاري تحميل بيانات التنفيذ واستلام البضائع...</p>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="bg-slate-900 border border-red-500/30 rounded-2xl p-6 text-red-400 text-xs text-center">
        خطأ في تحميل ملخص الاستلام: {error?.message || 'تعذر الوصول إلى البيانات'}
      </div>
    );
  }

  const summary = response?.data || response;
  if (!summary) return null;

  const { lines = [], receipts = [], shipments = [] } = summary;

  const handleLogReceiptSubmit = (payload) => {
    logReceiptMutation.mutate(payload, {
      onSuccess: () => {
        setIsModalOpen(false);
      }
    });
  };

  const handleAcceptClick = (receiptId) => {
    acceptReceiptMutation.mutate({ receiptId, poId });
  };

  // Compute overall totals strictly from backend returned lines
  const totalOrdered = lines.reduce((acc, l) => acc + (parseFloat(l.orderedQuantity) || 0), 0);
  const totalShipped = lines.reduce((acc, l) => acc + (parseFloat(l.shippedQuantity) || 0), 0);
  const totalReceived = lines.reduce((acc, l) => acc + (parseFloat(l.receivedQuantity) || 0), 0);
  const totalAccepted = lines.reduce((acc, l) => acc + (parseFloat(l.acceptedQuantity) || 0), 0);
  const totalDamaged = lines.reduce((acc, l) => acc + (parseFloat(l.damagedQuantity) || 0), 0);
  const totalRejected = lines.reduce((acc, l) => acc + (parseFloat(l.rejectedQuantity) || 0), 0);

  const activeShipmentsCount = shipments.filter(s => s.status !== 'preparing').length;

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-6 dir-rtl text-slate-100 shadow-xl">
      
      {/* Header & KPI Summary */}
      <div className="flex flex-wrap justify-between items-center gap-4 border-b border-slate-800 pb-5">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-indigo-600/20 border border-indigo-500/30 flex items-center justify-center text-xl">
            📦
          </div>
          <div>
            <h2 className="text-base font-black text-white">مرحلة فحص واستلام البضائع الميداني (Goods Receipt & Inspection)</h2>
            <p className="text-xs text-slate-400 mt-0.5">
              متابعة كميات الشحن والتأكد من مطابقة المستلم ميدانياً قبل الفوترة.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <span className="bg-slate-800 border border-slate-700 text-slate-300 text-xs px-3 py-1.5 rounded-xl font-mono">
            حالة التنفيذ: {summary.fulfillmentStatus || 'مستمر'}
          </span>
          <button
            onClick={() => setIsModalOpen(true)}
            disabled={activeShipmentsCount === 0}
            className="bg-emerald-600 hover:bg-emerald-500 disabled:opacity-40 disabled:cursor-not-allowed text-white text-xs font-bold px-4 py-2 rounded-xl shadow-lg transition-all flex items-center gap-2"
          >
            <span>➕</span> تسجيل استلام شحنة (Log Receipt)
          </button>
        </div>
      </div>

      {/* Aggregate KPI Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 text-xs">
        <div className="bg-slate-950 border border-slate-800 p-3.5 rounded-xl">
          <span className="text-slate-400 font-bold block text-[11px]">المتعاقد عليه</span>
          <span className="text-lg font-black text-white mt-1 block">{totalOrdered}</span>
        </div>
        <div className="bg-slate-950 border border-slate-800 p-3.5 rounded-xl">
          <span className="text-indigo-400 font-bold block text-[11px]">المشحون فعلياً</span>
          <span className="text-lg font-black text-indigo-300 mt-1 block">{totalShipped}</span>
        </div>
        <div className="bg-slate-950 border border-slate-800 p-3.5 rounded-xl">
          <span className="text-blue-400 font-bold block text-[11px]">المستلم ميدانياً</span>
          <span className="text-lg font-black text-blue-300 mt-1 block">{totalReceived}</span>
        </div>
        <div className="bg-slate-950 border border-slate-800 p-3.5 rounded-xl">
          <span className="text-emerald-400 font-bold block text-[11px]">المقبول (Accepted)</span>
          <span className="text-lg font-black text-emerald-300 mt-1 block">{totalAccepted}</span>
        </div>
        <div className="bg-slate-950 border border-slate-800 p-3.5 rounded-xl">
          <span className="text-amber-400 font-bold block text-[11px]">التالف (Damaged)</span>
          <span className="text-lg font-black text-amber-300 mt-1 block">{totalDamaged}</span>
        </div>
        <div className="bg-slate-950 border border-slate-800 p-3.5 rounded-xl">
          <span className="text-red-400 font-bold block text-[11px]">المرفوض (Rejected)</span>
          <span className="text-lg font-black text-red-300 mt-1 block">{totalRejected}</span>
        </div>
      </div>

      {/* Authoritative Line Items Matrix */}
      <div className="space-y-3">
        <h3 className="text-xs font-bold text-slate-300">جدول بنود طلب الشراء والمطابقة الميدانية</h3>

        <div className="overflow-x-auto border border-slate-800 rounded-xl bg-slate-950">
          <table className="w-full text-xs text-right border-collapse">
            <thead>
              <tr className="border-b border-slate-800 bg-slate-900/60 text-slate-400 font-bold">
                <th className="p-3">رمز البند/المنتج</th>
                <th className="p-3">المطلوب</th>
                <th className="p-3">المشحون</th>
                <th className="p-3">المستلم</th>
                <th className="p-3 text-emerald-400">المقبول</th>
                <th className="p-3 text-amber-400">التالف</th>
                <th className="p-3 text-red-400">المرفوض</th>
                <th className="p-3">متبقي شحن/استلام</th>
                <th className="p-3">متبقي قبول</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 text-slate-200">
              {lines.map(line => (
                <tr key={line.purchaseOrderLineId} className="hover:bg-slate-900/40 transition-colors">
                  <td className="p-3 font-mono font-bold text-white">
                    {line.productDNAId || line.purchaseOrderLineId.substring(0, 8)}
                  </td>
                  <td className="p-3 font-mono">{line.orderedQuantity}</td>
                  <td className="p-3 font-mono text-indigo-300">{line.shippedQuantity}</td>
                  <td className="p-3 font-mono text-blue-300">{line.receivedQuantity}</td>
                  <td className="p-3 font-mono text-emerald-400 font-bold">{line.acceptedQuantity}</td>
                  <td className="p-3 font-mono text-amber-400">{line.damagedQuantity}</td>
                  <td className="p-3 font-mono text-red-400">{line.rejectedQuantity}</td>
                  <td className="p-3 font-mono text-slate-400">{line.remainingToReceiveQuantity}</td>
                  <td className="p-3 font-mono text-emerald-300 font-bold">{line.remainingToAcceptQuantity}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Receipts Log & Inspection Acceptance Controls */}
      <div className="space-y-3 pt-2">
        <h3 className="text-xs font-bold text-slate-300">سجل مستندات الاستلام وإجراءات الفحص</h3>

        {receipts.length === 0 ? (
          <div className="p-4 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-400 text-center">
            لم يتم تسجيل أي استلام ميداني لهذه الشحنة حتى الآن.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
            {receipts.map((r, idx) => (
              <div key={r.receiptId} className="bg-slate-950 border border-slate-800 p-4 rounded-xl flex justify-between items-center gap-4">
                <div className="space-y-1">
                  <div className="font-bold text-white flex items-center gap-2">
                    <span>📑</span> مستند استلام #{idx + 1}
                    <span className={`text-[10px] px-2 py-0.5 rounded-full font-mono border ${
                      r.status === 'accepted' 
                        ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400' 
                        : 'bg-amber-500/10 border-amber-500/30 text-amber-300'
                    }`}>
                      {r.status === 'accepted' ? 'تم الفحص والقبول' : 'قيد الفحص (Pending)'}
                    </span>
                  </div>
                  <div className="text-[11px] text-slate-400">
                    الشحنة: <span className="font-mono text-slate-300">#{r.shipmentId ? r.shipmentId.substring(0, 8) : 'مباشرة'}</span>
                  </div>
                  <div className="text-[10px] text-slate-400 font-mono">
                    تاريخ الاستلام: {r.receivedAt ? new Date(r.receivedAt).toLocaleString() : ''}
                  </div>
                </div>

                {r.status === 'pending_inspection' && (
                  <button
                    onClick={() => handleAcceptClick(r.receiptId)}
                    disabled={acceptReceiptMutation.isLoading}
                    className="bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs px-3.5 py-1.5 rounded-lg shadow transition-all whitespace-nowrap"
                  >
                    {acceptReceiptMutation.isLoading ? 'جاري...' : 'اعتماد الفحص ❯'}
                  </button>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Inspection Modal */}
      <ReceiptInspectionModal 
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        summaryData={summary}
        onLogReceipt={handleLogReceiptSubmit}
        isLoading={logReceiptMutation.isLoading}
      />

    </div>
  );
};
