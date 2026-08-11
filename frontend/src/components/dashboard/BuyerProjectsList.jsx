import React from 'react';
import { useMyRequests, useUpdateRequestStatus, useDeleteDraft } from '../../hooks/queries/entityQueries';
import { Button } from '../common/Button';
import { useNavigate } from 'react-router-dom';

export const BuyerProjectsList = ({ statusFilter }) => {
  const { data: response, isLoading, error } = useMyRequests({});
  const updateStatusMutation = useUpdateRequestStatus();
  const deleteDraftMutation = useDeleteDraft();
  const navigate = useNavigate();

  if (isLoading) return <div className="text-gray-500 py-4">جاري التحميل...</div>;
  if (error) return <div className="text-red-500 py-4">حدث خطأ في التحميل.</div>;

  const requests = response?.data || [];
  
  // Filter by status
  const filtered = requests.filter(req => {
    if (statusFilter === 'active') {
      // Active means not draft and not completed/cancelled
      return req.status !== 'draft' && req.status !== 'completed' && req.status !== 'cancelled';
    }
    return req.status === statusFilter;
  });

  if (filtered.length === 0) {
    const emptyMessages = {
      draft: 'لا توجد لديك مسودات حالياً.',
      active: 'لا توجد مشاريع نشطة حالياً.',
      completed: 'لا توجد مشاريع مكتملة حالياً.'
    };
    return <div className="text-gray-500 py-4 text-center">{emptyMessages[statusFilter] || 'لا توجد بيانات.'}</div>;
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

  const getStatusLabel = (status) => {
    const labels = {
      draft: 'مسودة',
      published: 'منشور',
      quoting: 'استقبال العروض',
      under_review: 'تحت المراجعة',
      completed: 'مكتمل'
    };
    return labels[status] || status;
  };

  return (
    <div className="space-y-4">
      {filtered.map((req) => (
        <div key={req.id} className="bg-white border rounded-lg shadow-sm p-5 flex justify-between items-center hover:shadow-md transition">
          <div>
            <div className="flex items-center gap-3">
              <h4 className="font-bold text-lg text-gray-900">{req.title}</h4>
              <span className={`px-2 py-0.5 rounded text-xs font-bold ${
                req.status === 'draft' ? 'bg-gray-100 text-gray-700' : 'bg-blue-100 text-blue-800'
              }`}>
                {getStatusLabel(req.status)}
              </span>
            </div>
            <p className="text-sm text-gray-600 mt-2">{req.description || 'لا يوجد وصف.'}</p>
            <div className="text-xs text-gray-400 mt-3 flex gap-4">
              <span>تاريخ البدء: {new Date(req.createdAt).toLocaleDateString()}</span>
              {req.workPackages && <span>الحزم: {req.workPackages.length}</span>}
            </div>
          </div>
          <div className="flex gap-2">
            {req.status === 'draft' ? (
              <>
                <Button variant="secondary" size="sm" onClick={() => navigate(`/requests/${req.id}/edit`)}>
                  تعديل
                </Button>
                <Button size="sm" onClick={() => handlePublish(req.id)} isLoading={updateStatusMutation.isPending}>
                  نشر
                </Button>
                <Button 
                  size="sm" 
                  className="bg-red-50 text-red-600 hover:bg-red-100 border border-red-100 font-bold"
                  onClick={() => handleDelete(req.id)} 
                  isLoading={deleteDraftMutation.isPending}
                >
                  حذف
                </Button>
              </>
            ) : (
              <Button size="sm" onClick={() => navigate(`/workspace/${req.id}`)}>
                فتح مساحة العمل (Workspace) ❯
              </Button>
            )}
          </div>
        </div>
      ))}
    </div>
  );
};
