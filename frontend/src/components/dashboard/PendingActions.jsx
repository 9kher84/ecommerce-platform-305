import React from 'react';
import { useInbox } from '../../hooks/queries/commercialQueries';
import { Button } from '../common/Button';
import { useNavigate } from 'react-router-dom';

export const PendingActions = () => {
  const { data: response, isLoading, error } = useInbox();
  const navigate = useNavigate();

  if (isLoading) return <div className="text-gray-500 py-2">جاري تحميل الإجراءات المعلقة...</div>;
  if (error) return null; // Fail silently in dash

  const pendingAwards = response?.data?.pendingAwards || [];

  if (pendingAwards.length === 0) {
    return (
      <div className="bg-green-50 border border-green-200 rounded-md p-4 text-green-800 text-sm">
        ✨ جميع المهام مكتملة! لا توجد إجراءات معلقة حالياً.
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="bg-yellow-50 border border-yellow-200 rounded-md p-4 text-yellow-800 text-sm flex justify-between items-center">
        <div>
          ⚠️ هناك <strong>{pendingAwards.length}</strong> عروض أسعار مقبولة بانتظار الاعتماد النهائي والترسية.
        </div>
        <Button size="sm" onClick={() => navigate('/inbox')}>
          انتقل للصندوق الوارد التجاري
        </Button>
      </div>
    </div>
  );
};
