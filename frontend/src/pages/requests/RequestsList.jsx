import React, { useState } from 'react';
import { useRequests } from '../../hooks/queries/entityQueries';
import { RequestCard } from '../../components/requests/RequestCard';
import { RequestFilters } from '../../components/requests/RequestFilters';
import { Button } from '../../components/common/Button';
import apiClient from '../../services/apiClient';

export const RequestsList = () => {
  const [params, setParams] = useState({ page: 1, limit: 10, search: '', status: '' });
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [budget, setBudget] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const { data, isLoading, isError, error, refetch } = useRequests(params);

  const handleCreateRequest = async (e) => {
    e.preventDefault();
    if (!title.trim()) return;
    setSubmitting(true);
    try {
      await apiClient.post('/api/requests', {
        title,
        description,
        estimatedBudget: Number(budget) || 50000,
        items: [{ title: title, quantity: 1, unit: 'مقطوعية', targetPrice: Number(budget) || 50000 }]
      });
      setTitle('');
      setDescription('');
      setBudget('');
      setIsModalOpen(false);
      refetch();
    } catch (err) {
      console.error('Failed to create RFQ:', err);
    } finally {
      setSubmitting(false);
    }
  };

  const requests = data?.data || [];
  const pagination = data?.pagination || { current: 1, total: 1, count: 0 };

  return (
    <div className="max-w-7xl mx-auto space-y-6 dir-rtl">
      {/* Header with Live Action Button */}
      <div className="flex justify-between items-center bg-white p-6 rounded-2xl border border-gray-200 shadow-sm">
        <div>
          <h1 className="text-2xl font-black text-gray-900">طلبات الشراء والمنافسات (Purchase Requests)</h1>
          <p className="text-xs text-gray-500 mt-1">تصفح الطلبات الحالية أو قم بنشر منافسة جديدة للبائعين.</p>
        </div>
        <Button 
          onClick={() => setIsModalOpen(true)} 
          className="bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs px-5 py-3 rounded-xl shadow-lg shadow-indigo-600/20">
          + إنشاء طلب شراء جديد
        </Button>
      </div>

      <RequestFilters onFilterChange={(newFilters) => setParams(prev => ({ ...prev, ...newFilters, page: 1 }))} />

      {isLoading ? (
        <div className="flex justify-center p-12">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-indigo-600"></div>
        </div>
      ) : isError ? (
        <div className="bg-red-50 text-red-700 p-4 rounded-md">
          خطأ في تحميل الطلبات: {error?.message}
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

      {/* Live Create RFQ Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex justify-center items-center z-50 p-4">
          <div className="bg-white rounded-3xl p-6 max-w-lg w-full shadow-2xl border border-slate-200 space-y-4">
            <div className="flex justify-between items-center border-b pb-3">
              <h3 className="font-black text-lg text-slate-900">إنشاء طلب شراء ومنافسة جديدة</h3>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-600 font-bold">✕</button>
            </div>

            <form onSubmit={handleCreateRequest} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">عنوان الطلب / الشحنة *</label>
                <input 
                  type="text" 
                  required
                  placeholder="مثال: توريد حديد 12 مم لبناء مجمع سكني"
                  value={title} 
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full border border-slate-300 rounded-xl p-3 text-xs focus:ring-2 focus:ring-indigo-500 outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">وصف الطلب والمواصفات</label>
                <textarea 
                  rows={3}
                  placeholder="تفاصيل التوريد، الجدول الزمني، ومعايير الجودة..."
                  value={description} 
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full border border-slate-300 rounded-xl p-3 text-xs focus:ring-2 focus:ring-indigo-500 outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">الميزانية التقديرية (SAR)</label>
                <input 
                  type="number" 
                  placeholder="50000"
                  value={budget} 
                  onChange={(e) => setBudget(e.target.value)}
                  className="w-full border border-slate-300 rounded-xl p-3 text-xs focus:ring-2 focus:ring-indigo-500 outline-none"
                />
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <Button type="button" variant="secondary" onClick={() => setIsModalOpen(false)} className="text-xs">
                  إلغاء
                </Button>
                <Button type="submit" disabled={submitting} className="bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs px-6 py-2.5">
                  {submitting ? 'جاري النشر...' : 'نشر الطلب للتنافس 🚀'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
