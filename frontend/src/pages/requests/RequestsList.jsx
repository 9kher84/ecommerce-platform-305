import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useRequests } from '../../hooks/queries/entityQueries';
import { RequestCard } from '../../components/requests/RequestCard';
import { RequestFilters } from '../../components/requests/RequestFilters';
import { Button } from '../../components/common/Button';
import { getErrorMessage } from '../../utils/errorUtils';
import { usePolicy } from '../../providers/PolicyEngineProvider';

export const RequestsList = () => {
  const navigate = useNavigate();
  const policy = usePolicy();
  const [params, setParams] = useState({ page: 1, limit: 10, search: '', status: '' });

  const { data, isLoading, isError, error } = useRequests(params);

  const requests = data?.data || [];

  return (
    <div className="max-w-7xl mx-auto space-y-6 dir-rtl">
      {/* Header with Live Action Button */}
      <div className="flex justify-between items-center bg-white p-6 rounded-2xl border border-gray-200 shadow-sm">
        <div>
          <h1 className="text-2xl font-black text-gray-900">طلبات الشراء والمنافسات (Purchase Requests)</h1>
          <p className="text-xs text-gray-500 mt-1">تصفح الطلبات الحالية أو قم بنشر منافسة جديدة للبائعين.</p>
        </div>
        {policy.can('BUYER_PROCUREMENT') && (
          <Button 
            onClick={() => navigate('/intake')} 
            className="bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs px-5 py-3 rounded-xl shadow-lg shadow-indigo-600/20">
            + إنشاء طلب شراء جديد
          </Button>
        )}
      </div>

      <RequestFilters onFilterChange={(newFilters) => setParams(prev => ({ ...prev, ...newFilters, page: 1 }))} />

      {isLoading ? (
        <div className="flex justify-center p-12">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-indigo-600"></div>
        </div>
      ) : isError ? (
        <div className="bg-red-50 text-red-700 p-4 rounded-md">
          خطأ في تحميل الطلبات: {getErrorMessage(error)}
        </div>
      ) : (
        <>
          {requests.length === 0 ? (
            <div className="bg-white border border-gray-200 rounded-2xl p-12 text-center text-gray-500">
              لا توجد طلبات شراء مطابقة حالياً. اضغط على "+ إنشاء طلب شراء جديد" للبدء.
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
              {requests.map(req => (
                <RequestCard key={req.id} request={req} />
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
};
