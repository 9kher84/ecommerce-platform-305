import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useCommercialMatrix } from '../../hooks/queries/commercialQueries';

export const WorkPackageDetails = () => {
  const { id, packageId } = useParams();
  const navigate = useNavigate();
  
  const [selectedSuppliers, setSelectedSuppliers] = useState([]);

  // Fetch real matrix data
  const { data: response, isLoading, isError } = useCommercialMatrix(packageId);

  if (isLoading) return <div className="p-8 text-center">Loading Matrix...</div>;
  if (isError) return <div className="p-8 text-center text-red-500">Error loading Matrix.</div>;

  const processes = response?.data || [];
  
  // Transform backend processes to suppliers array for the Matrix UI
  const suppliers = processes.map(proc => {
    // We assume the seller party is the one that's not the buyer (or has role SELLER)
    const sellerParty = proc.parties?.find(p => p.partyRole === 'SELLER');
    const latestSheet = proc.negotiationSheets?.[proc.negotiationSheets.length - 1];
    
    return {
      id: proc.id, // We use the processId as the key for comparison / timeline linking
      name: sellerParty ? `Seller User ${sellerParty.userId.substring(0, 5)}` : 'Unknown Seller', // Real implementation would populate user details
      price: latestSheet?.terms?.price || 0,
      delivery: latestSheet?.terms?.deliveryDays ? `${latestSheet.terms.deliveryDays} Days` : 'N/A',
      round: latestSheet ? `V${latestSheet.version}` : 'N/A',
      status: proc.status,
      rating: 4.5, // Mock rating for now
      lastUpdated: new Date(proc.updatedAt).toLocaleDateString()
    };
  });

  const handleSelect = (id) => {
    setSelectedSuppliers(prev => 
      prev.includes(id) ? prev.filter(s => s !== id) : [...prev, id]
    );
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'waiting_buyer': return 'bg-green-100 text-green-800 border-green-200'; // 🟢 بانتظارك
      case 'waiting_seller': return 'bg-blue-100 text-blue-800 border-blue-200'; // 🔵 بانتظار المورد
      case 'expiring': return 'bg-yellow-100 text-yellow-800 border-yellow-200'; // 🟡 اقتربت الصلاحية
      case 'expired': return 'bg-red-100 text-red-800 border-red-200'; // 🔴 انتهت
      case 'pending_award': return 'bg-purple-100 text-purple-800 border-purple-200';
      case 'awarded': return 'bg-green-600 text-white border-green-600';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getStatusText = (status) => {
    switch (status) {
      case 'waiting_buyer': return 'بانتظارك';
      case 'waiting_seller': return 'بانتظار المورد';
      case 'expiring': return 'اقتربت الصلاحية';
      case 'expired': return 'انتهت';
      case 'pending_award': return 'ترسية معلقة';
      case 'awarded': return 'تمت الترسية';
      default: return status;
    }
  };

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      
      <div className="flex justify-between items-center">
        <div>
          <button onClick={() => navigate(-1)} className="text-sm text-indigo-600 hover:text-indigo-800 mb-2 inline-block">
            ← عودة للمشروع
          </button>
          <h1 className="text-2xl font-bold text-gray-900">إدارة حزمة الأعمال (Work Package CRM)</h1>
          <p className="text-sm text-gray-500">ID: {packageId}</p>
        </div>
        {selectedSuppliers.length > 0 && (
          <button 
            onClick={() => navigate(`/requests/${id}/packages/${packageId}/compare?ids=${selectedSuppliers.join(',')}`)}
            className="px-6 py-2 bg-indigo-600 text-white font-bold rounded-lg shadow hover:bg-indigo-700 transition"
          >
            مقارنة العروض ({selectedSuppliers.length})
          </button>
        )}
      </div>

      {/* Negotiation Matrix */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
        <div className="bg-gray-50 p-4 border-b border-gray-200 flex justify-between items-center">
          <h2 className="text-lg font-bold text-gray-800">مصفوفة التفاوض (Negotiation Matrix)</h2>
        </div>
        
        <table className="w-full text-right">
          <thead className="bg-gray-50 border-b border-gray-200 text-gray-500 text-sm">
            <tr>
              <th className="p-4 w-12 text-center">مقارنة</th>
              <th className="p-4">المورد (العملية)</th>
              <th className="p-4">آخر سعر</th>
              <th className="p-4">مدة التسليم</th>
              <th className="p-4">الجولة</th>
              <th className="p-4">الحالة</th>
              <th className="p-4">التقييم</th>
              <th className="p-4">آخر تحديث</th>
              <th className="p-4">إجراء</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {suppliers.map(sup => (
              <tr key={sup.id} className="hover:bg-gray-50 transition-colors">
                <td className="p-4 text-center">
                  <input 
                    type="checkbox" 
                    className="w-4 h-4 text-indigo-600 rounded border-gray-300 focus:ring-indigo-500"
                    checked={selectedSuppliers.includes(sup.id)}
                    onChange={() => handleSelect(sup.id)}
                  />
                </td>
                <td className="p-4 font-bold text-gray-900">{sup.name}</td>
                <td className="p-4 font-mono text-gray-700">${sup.price.toLocaleString()}</td>
                <td className="p-4 text-gray-700">{sup.delivery}</td>
                <td className="p-4 text-gray-700 font-bold">{sup.round}</td>
                <td className="p-4">
                  <span className={`px-3 py-1 rounded-full text-xs font-bold border ${getStatusColor(sup.status)}`}>
                    {getStatusText(sup.status)}
                  </span>
                </td>
                <td className="p-4 text-yellow-600 font-bold">★ {sup.rating}</td>
                <td className="p-4 text-gray-500 text-sm">{sup.lastUpdated}</td>
                <td className="p-4">
                  <button 
                    onClick={() => navigate(`/requests/${id}/packages/${packageId}/processes/${sup.id}`)}
                    className="text-indigo-600 hover:text-indigo-900 font-bold text-sm"
                  >
                    فتح التفاوض
                  </button>
                </td>
              </tr>
            ))}
            {suppliers.length === 0 && (
              <tr>
                <td colSpan="9" className="p-8 text-center text-gray-500">لا يوجد موردين متقدمين لهذه الحزمة بعد.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};
