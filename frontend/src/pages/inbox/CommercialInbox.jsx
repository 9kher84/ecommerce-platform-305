import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useInbox, useCheckoutAwards, useGeneratePO } from '../../hooks/queries/commercialQueries';
import { useAuth } from '../../providers/AuthProvider';

export const CommercialInbox = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  
  const [selectedItemIds, setSelectedItemIds] = useState([]);

  // Fetch real inbox data
  const { data: response, isLoading, isError } = useInbox();
  const checkoutMutation = useCheckoutAwards();
  const generatePOMutation = useGeneratePO();

  if (isLoading) return <div className="p-8 text-center">Loading Inbox...</div>;
  if (isError) return <div className="p-8 text-center text-red-500">Error loading Inbox.</div>;

  const pendingAwards = response?.data?.pendingAwards || [];

  const getWpName = (wp) => {
    if (!wp || !wp.name) return 'تفاوض تجاري';
    if (typeof wp.name === 'object') {
      return wp.name.name_ar || wp.name.name_en || 'تفاوض تجاري';
    }
    return String(wp.name);
  };

  // Transform to common inbox format safely
  const inboxItems = pendingAwards.map(award => {
    const wpName = getWpName(award?.workPackage);
    const dateStr = award?.updatedAt ? new Date(award.updatedAt).toLocaleDateString() : '';
    const processIdStr = award?.id ? String(award.id).substring(0, 8) : '';
    return {
      id: award.id,
      type: 'pending_award',
      title: award?.workPackage ? `اعتماد ترسية: حزمة ${wpName}` : `Award Pending: Process #${processIdStr}`,
      processId: award.id,
      workPackageId: award?.workPackage?.id || '1',
      requestId: award?.workPackage?.purchaseRequestId || '1',
      date: dateStr,
      selected: selectedItemIds.includes(award.id)
    };
  });

  const handleSelect = (id) => {
    setSelectedItemIds(prev => 
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    );
  };

  const handleCheckout = () => {
    if (selectedItemIds.length === 0) return;
    checkoutMutation.mutate(selectedItemIds, {
      onSuccess: (res) => {
        const createdPOs = res?.data?.createdPurchaseOrders || res?.createdPurchaseOrders || [];
        alert(`تمت الترسية وإصدار أمر الشراء بنجاح! تم اعتماد ${selectedItemIds.length} حزم وتوليد ${createdPOs.length} أمر شراء.`);
        setSelectedItemIds([]);
      },
      onError: (err) => {
        console.error("Checkout error:", err);
        alert(err?.response?.data?.message || err?.message || "حدث خطأ أثناء اعتماد الترسية وإصدار أمر الشراء.");
      }
    });
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-900">صندوق الوارد التجاري (Commercial Inbox)</h1>
        
        {/* Shopping Cart Actions */}
        {selectedItemIds.length > 0 && (
          <button 
            onClick={handleCheckout} 
            disabled={checkoutMutation.isPending}
            className="px-6 py-2 bg-green-600 text-white font-bold rounded-lg shadow hover:bg-green-700 flex items-center gap-2 disabled:opacity-50"
          >
            <span>🛒</span>
            اعتماد الترسية ({selectedItemIds.length}) Award Selected
          </button>
        )}
      </div>

      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
        <div className="divide-y divide-gray-200">
          {inboxItems.map((item) => (
            <div key={item.id} className={`p-4 flex items-center gap-4 hover:bg-gray-50 transition-colors ${item.selected ? 'bg-indigo-50' : ''}`}>
              
              {/* Checkbox for Pending Awards */}
              <div className="w-6">
                {item.type === 'pending_award' && (
                  <input 
                    type="checkbox" 
                    className="w-5 h-5 text-indigo-600 rounded border-gray-300 focus:ring-indigo-500 cursor-pointer"
                    checked={item.selected}
                    onChange={() => handleSelect(item.id)}
                  />
                )}
              </div>

              {/* Icon */}
              <div className="w-10 h-10 rounded-full flex items-center justify-center shrink-0 bg-gray-100">
                {item.type === 'pending_award' && '🏆'}
                {item.type === 'approval_needed' && '⏳'}
                {item.type === 'ai_recommendation' && '🤖'}
              </div>

              {/* Content */}
              <div className="flex-1 cursor-pointer" onClick={() => item.type === 'pending_award' && navigate(`/requests/${item.requestId}/packages/${item.workPackageId}/processes/${item.processId}`)}>
                <h3 className={`text-lg ${item.type === 'pending_award' ? 'font-bold text-gray-900' : 'text-gray-700'}`}>
                  {item.title}
                </h3>
                <p className="text-sm text-gray-500">{item.date}</p>
              </div>

            </div>
          ))}
          {inboxItems.length === 0 && (
            <div className="p-12 text-center space-y-3">
              <span className="text-4xl block">🏆</span>
              <h3 className="text-lg font-bold text-gray-800">لا توجد موافقات أو ترسيات معلقة بانتظار الاعتماد</h3>
              <p className="text-sm text-gray-500">تم اعتماد الترسيات السابقة بنجاح ونقلها إلى مرحلة الإصدار والتنفيذ (AWARDED / PO Issued).</p>
            </div>
          )}
        </div>
      </div>

      {selectedItemIds.length > 0 && (
        <div className="bg-indigo-50 border border-indigo-200 rounded-lg p-4 flex justify-between items-center mt-4 shadow-sm">
          <span className="text-indigo-900 font-medium">لقد قمت بتحديد {selectedItemIds.length} من حزم العروض للترسية.</span>
          <button 
            onClick={handleCheckout} 
            disabled={checkoutMutation.isPending}
            className="px-6 py-2.5 bg-green-600 hover:bg-green-700 text-white font-bold rounded shadow transition flex items-center gap-2"
          >
            إتمام اعتماد الترسية والدفع ❯
          </button>
        </div>
      )}
    </div>
  );
};
