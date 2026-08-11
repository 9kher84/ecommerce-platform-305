import React from 'react';
import { useMyRequests, useUpdateRequestStatus, useDeleteDraft } from '../../hooks/queries/entityQueries';
import { Button } from '../common/Button';
import { useNavigate } from 'react-router-dom';

export const BuyerDrafts = () => {
  const { data: response, isLoading, error } = useMyRequests({});
  const updateStatusMutation = useUpdateRequestStatus();
  const deleteDraftMutation = useDeleteDraft();
  const navigate = useNavigate();

  if (isLoading) return <div className="text-gray-500 py-4">جاري تحميل المسودات...</div>;
  if (error) return <div className="text-red-500 py-4">حدث خطأ في تحميل المسودات.</div>;

  const drafts = response?.data?.filter(req => req.status === 'draft') || [];

  if (drafts.length === 0) {
    return <div className="text-gray-500 py-4">لا توجد لديك مسودات حالياً.</div>;
  }

  const handlePublish = (id) => {
    if (window.confirm('هل أنت متأكد من نشر هذا الطلب؟')) {
      updateStatusMutation.mutate({ id, status: 'published' });
    }
  };

  const handleDelete = (id) => {
    if (window.confirm('هل أنت متأكد من نقل هذه المسودة إلى المهملات (Trash)؟')) {
      deleteDraftMutation.mutate(id);
    }
  };

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-medium text-gray-900 mb-4">مسوداتي (Drafts)</h3>
      {drafts.map((draft) => (
        <div key={draft.id} className="bg-white border rounded-lg shadow-sm p-4 flex justify-between items-center">
          <div>
            <h4 className="font-bold text-gray-800">{draft.title}</h4>
            <p className="text-sm text-gray-500 mt-1">الكمية: {draft.quantity} {draft.unit}</p>
            <p className="text-xs text-gray-400 mt-1">تاريخ الإنشاء: {new Date(draft.createdAt).toLocaleDateString()}</p>
          </div>
          <div className="flex gap-2">
            <Button variant="secondary" size="sm" onClick={() => navigate(`/requests/${draft.id}/edit`)}>
              تعديل (Edit)
            </Button>
            <Button size="sm" onClick={() => handlePublish(draft.id)} isLoading={updateStatusMutation.isPending}>
              نشر (Publish)
            </Button>
            <Button 
              size="sm" 
              className="bg-red-50 text-red-600 hover:bg-red-100 border border-red-100 font-bold"
              onClick={() => handleDelete(draft.id)} 
              isLoading={deleteDraftMutation.isPending}
            >
              حذف
            </Button>
          </div>
        </div>
      ))}
    </div>
  );
};
