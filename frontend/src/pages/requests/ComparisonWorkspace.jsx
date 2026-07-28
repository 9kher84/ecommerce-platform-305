import React from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { useCommercialMatrix } from '../../hooks/queries/commercialQueries';

export const ComparisonWorkspace = () => {
  const { id, packageId } = useParams();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  
  const supplierIdsParam = searchParams.get('ids');
  const selectedProcessIds = supplierIdsParam ? supplierIdsParam.split(',') : [];

  const { data: response, isLoading, isError } = useCommercialMatrix(packageId);

  if (isLoading) return <div className="p-8 text-center">Loading Comparison...</div>;
  if (isError) return <div className="p-8 text-center text-red-500">Error loading comparison data.</div>;

  const allProcesses = response?.data || [];
  const selectedProcesses = allProcesses.filter(p => selectedProcessIds.includes(p.id));

  if (selectedProcesses.length === 0) {
    return <div className="p-8 text-center text-gray-500">No suppliers selected for comparison.</div>;
  }

  // Extract suppliers and terms dynamically
  const suppliers = selectedProcesses.map(proc => {
    const sellerParty = proc.parties?.find(p => p.partyRole === 'SELLER');
    const latestSheet = proc.negotiationSheets?.[proc.negotiationSheets.length - 1];
    
    return {
      id: proc.id,
      name: sellerParty ? `Seller ${sellerParty.userId.substring(0,5)}` : 'Unknown',
      terms: latestSheet?.terms || {}
    };
  });

  // Extract all unique term keys across selected suppliers
  const termKeys = [...new Set(suppliers.flatMap(s => Object.keys(s.terms)))];

  // Helper to find the best value for numeric terms (like price, deliveryDays)
  const getBestValue = (key) => {
    const values = suppliers.map(s => s.terms[key]).filter(v => typeof v === 'number');
    if (values.length === 0) return null;
    return Math.min(...values);
  };

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <button onClick={() => navigate(-1)} className="text-sm text-indigo-600 hover:text-indigo-800 mb-2 inline-block">
            ← عودة للمصفوفة
          </button>
          <h1 className="text-2xl font-bold text-gray-900">مقارنة العروض (Comparison Workspace)</h1>
          <p className="text-sm text-gray-500">مقارنة {suppliers.length} عروض جنباً إلى جنب</p>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-x-auto">
        <table className="w-full text-right border-collapse">
          <thead>
            <tr className="bg-gray-50 border-b border-gray-200">
              <th className="p-4 w-48 font-bold text-gray-700 border-l border-gray-200">البند (Term)</th>
              {suppliers.map(sup => (
                <th key={sup.id} className="p-4 font-bold text-gray-900 border-l border-gray-200 last:border-0 text-center">
                  <div className="mb-2">{sup.name}</div>
                  <button 
                    onClick={() => navigate(`/requests/${id}/packages/${packageId}/processes/${sup.id}`)}
                    className="px-4 py-1 text-xs bg-indigo-100 text-indigo-700 rounded hover:bg-indigo-200 transition"
                  >
                    فتح التفاوض
                  </button>
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {termKeys.map(key => {
              const bestValue = getBestValue(key);
              
              return (
                <tr key={key} className="hover:bg-gray-50 transition-colors">
                  <td className="p-4 font-bold text-gray-700 border-l border-gray-200 capitalize">
                    {key.replace(/([A-Z])/g, ' $1').trim()}
                  </td>
                  
                  {suppliers.map(sup => {
                    const value = sup.terms[key];
                    const isBest = typeof value === 'number' && value === bestValue;
                    
                    return (
                      <td 
                        key={`${key}-${sup.id}`} 
                        className={`p-4 border-l border-gray-200 last:border-0 text-center font-mono ${
                          isBest ? 'bg-green-50 text-green-700 font-bold' : 'text-gray-700'
                        }`}
                      >
                        {isBest && <span className="mr-1 text-green-500">★</span>}
                        {value !== undefined ? value.toLocaleString() : '-'}
                      </td>
                    );
                  })}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};
