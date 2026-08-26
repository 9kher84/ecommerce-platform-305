import React, { useState } from 'react';

export const ReceiptInspectionModal = ({ isOpen, onClose, summaryData, onLogReceipt, isLoading }) => {
  const [selectedShipmentId, setSelectedShipmentId] = useState('');
  const [lineQuantities, setLineQuantities] = useState({});
  const [rejectionReasons, setRejectionReasons] = useState({});
  const [formError, setFormError] = useState('');

  if (!isOpen || !summaryData) return null;

  const { purchaseOrderId, lines = [], shipments = [] } = summaryData;

  // Dispatched shipments available for receipt
  const activeShipments = shipments.filter(s => s.status !== 'preparing');

  const handleShipmentSelect = (shipmentId) => {
    setSelectedShipmentId(shipmentId);
    setFormError('');
    // Reset quantities
    const initialQty = {};
    lines.forEach(l => {
      initialQty[l.purchaseOrderLineId] = {
        acceptedQuantity: 0,
        damagedQuantity: 0,
        rejectedQuantity: 0
      };
    });
    setLineQuantities(initialQty);
  };

  const handleQuantityChange = (poLineId, field, value) => {
    const parsed = Math.max(0, parseFloat(value) || 0);
    setLineQuantities(prev => ({
      ...prev,
      [poLineId]: {
        ...prev[poLineId],
        [field]: parsed
      }
    }));
  };

  const handleReasonChange = (poLineId, value) => {
    setRejectionReasons(prev => ({
      ...prev,
      [poLineId]: value
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!selectedShipmentId) {
      setFormError('الرجاء اختيار الشحنة المستلمة أولاً (Shipment Selection Required)');
      return;
    }

    const receiptLines = lines.map(line => {
      const lineQty = lineQuantities[line.purchaseOrderLineId] || { acceptedQuantity: 0, damagedQuantity: 0, rejectedQuantity: 0 };
      return {
        purchaseOrderLineId: line.purchaseOrderLineId,
        acceptedQuantity: lineQty.acceptedQuantity || 0,
        damagedQuantity: lineQty.damagedQuantity || 0,
        rejectedQuantity: lineQty.rejectedQuantity || 0,
        rejectionReason: rejectionReasons[line.purchaseOrderLineId] || null
      };
    }).filter(l => (l.acceptedQuantity + l.damagedQuantity + l.rejectedQuantity) > 0);

    if (receiptLines.length === 0) {
      setFormError('يرجى إدخال كمية استلام واحدة على الأقل (أو المقبولة/التالفة/المرفوضة)');
      return;
    }

    onLogReceipt({
      poId: purchaseOrderId,
      shipmentId: selectedShipmentId,
      lines: receiptLines
    });
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 dir-rtl">
      <div className="bg-slate-900 border border-slate-800 text-slate-100 rounded-2xl max-w-3xl w-full max-h-[90vh] flex flex-col shadow-2xl overflow-hidden">
        
        {/* Header */}
        <div className="p-5 border-b border-slate-800 flex justify-between items-center bg-slate-950">
          <div>
            <h3 className="text-base font-black text-white flex items-center gap-2">
              <span>📦</span> تسجيل استلام شحنة وفحص البضائع (Log Goods Receipt)
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              طلب شراء: <span className="font-mono text-indigo-300 font-bold">{summaryData.purchaseOrderNumber || purchaseOrderId}</span>
            </p>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-white text-xl font-bold p-1">✕</button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 overflow-y-auto space-y-6 flex-1">
          
          {formError && (
            <div className="p-3.5 bg-red-500/10 border border-red-500/30 text-red-300 rounded-xl text-xs font-bold flex items-center gap-2">
              <span>🛑</span> {formError}
            </div>
          )}

          {/* Step 1: Shipment Selection */}
          <div className="space-y-2">
            <label className="block text-xs font-bold text-slate-200">
              1. اختر الشحنة المشحونة ميدانياً (Select Dispatched Shipment) <span className="text-red-400">*</span>
            </label>

            {activeShipments.length === 0 ? (
              <div className="p-4 bg-amber-500/10 border border-amber-500/20 text-amber-300 rounded-xl text-xs text-center">
                لا توجد شحنات مشحونة قيد الترانزيت حالياً لهذا الطلب.
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-2">
                {activeShipments.map(s => (
                  <label 
                    key={s.shipmentId}
                    className={`p-3.5 rounded-xl border text-xs cursor-pointer flex justify-between items-center transition-all ${
                      selectedShipmentId === s.shipmentId 
                        ? 'bg-indigo-600/20 border-indigo-500 text-white shadow-md' 
                        : 'bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <input 
                        type="radio" 
                        name="shipmentId" 
                        value={s.shipmentId}
                        checked={selectedShipmentId === s.shipmentId}
                        onChange={() => handleShipmentSelect(s.shipmentId)}
                        className="text-indigo-600 focus:ring-indigo-500"
                      />
                      <div>
                        <div className="font-bold text-slate-200">شحنة #{s.shipmentId.substring(0, 8)} {s.trackingNumber ? `(تتبع: ${s.trackingNumber})` : ''}</div>
                        <div className="text-[11px] text-slate-400">الناقل: {s.carrier || 'خاص'} | الحالة: {s.status}</div>
                      </div>
                    </div>
                    <span className="bg-slate-800 text-slate-300 px-2.5 py-1 rounded font-mono text-[10px]">
                      {s.dispatchedAt ? new Date(s.dispatchedAt).toLocaleDateString() : ''}
                    </span>
                  </label>
                ))}
              </div>
            )}
          </div>

          {/* Step 2: Line Items Entry */}
          {selectedShipmentId && (
            <div className="space-y-4 pt-4 border-t border-slate-800">
              <label className="block text-xs font-bold text-slate-200">
                2. أدخل الكميات المستلمة ونتائج الفحص (Enter Inspected Quantities)
              </label>

              <div className="space-y-4">
                {lines.map((line, idx) => {
                  const qty = lineQuantities[line.purchaseOrderLineId] || { acceptedQuantity: 0, damagedQuantity: 0, rejectedQuantity: 0 };
                  return (
                    <div key={line.purchaseOrderLineId} className="bg-slate-950 border border-slate-800 p-4 rounded-xl space-y-3">
                      <div className="flex justify-between items-center text-xs">
                        <span className="font-bold text-white">بند #{idx + 1} (رمز المنتج: {line.productDNAId || line.purchaseOrderLineId.substring(0, 8)})</span>
                        <span className="text-slate-400 text-[11px]">
                          المشحون: <strong className="text-indigo-400">{line.shippedQuantity}</strong> | المتبقي للاستلام: <strong className="text-emerald-400">{line.remainingToReceiveQuantity}</strong>
                        </span>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                        <div>
                          <label className="block text-[11px] text-emerald-400 font-bold mb-1">الكمية المقبولة (Accepted)</label>
                          <input 
                            type="number"
                            min="0"
                            value={qty.acceptedQuantity}
                            onChange={(e) => handleQuantityChange(line.purchaseOrderLineId, 'acceptedQuantity', e.target.value)}
                            className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-1.5 text-slate-100 font-mono text-sm focus:border-indigo-500 focus:outline-none"
                          />
                        </div>

                        <div>
                          <label className="block text-[11px] text-amber-400 font-bold mb-1">الكمية التالفة (Damaged)</label>
                          <input 
                            type="number"
                            min="0"
                            value={qty.damagedQuantity}
                            onChange={(e) => handleQuantityChange(line.purchaseOrderLineId, 'damagedQuantity', e.target.value)}
                            className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-1.5 text-slate-100 font-mono text-sm focus:border-indigo-500 focus:outline-none"
                          />
                        </div>

                        <div>
                          <label className="block text-[11px] text-red-400 font-bold mb-1">الكمية المرفوضة (Rejected)</label>
                          <input 
                            type="number"
                            min="0"
                            value={qty.rejectedQuantity}
                            onChange={(e) => handleQuantityChange(line.purchaseOrderLineId, 'rejectedQuantity', e.target.value)}
                            className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-1.5 text-slate-100 font-mono text-sm focus:border-indigo-500 focus:outline-none"
                          />
                        </div>
                      </div>

                      {(qty.damagedQuantity > 0 || qty.rejectedQuantity > 0) && (
                        <div>
                          <label className="block text-[11px] text-slate-400 mb-1">سبب الملاحظات / الرفض (Rejection Reason)</label>
                          <input 
                            type="text"
                            placeholder="مثال: تلف الكرتون الخارجي أو وجود خدوش بالبضاعة..."
                            value={rejectionReasons[line.purchaseOrderLineId] || ''}
                            onChange={(e) => handleReasonChange(line.purchaseOrderLineId, e.target.value)}
                            className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-1.5 text-slate-200 text-xs focus:border-indigo-500 focus:outline-none"
                          />
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}
          
        </form>

        {/* Footer */}
        <div className="p-4 border-t border-slate-800 bg-slate-950 flex justify-end gap-3">
          <button 
            type="button" 
            onClick={onClose}
            className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold rounded-xl transition-all"
          >
            إلغاء
          </button>
          <button 
            type="button"
            onClick={handleSubmit}
            disabled={isLoading || !selectedShipmentId}
            className="px-6 py-2 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white text-xs font-bold rounded-xl shadow-lg transition-all flex items-center gap-2"
          >
            {isLoading ? 'جاري التسجيل...' : 'تأكيد تسجيل استلام الشحنة ❯'}
          </button>
        </div>

      </div>
    </div>
  );
};
