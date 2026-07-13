import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useRequestDetails, useUpdateRequest } from '../../hooks/queries/entityQueries';
import { Button } from '../../components/common/Button';

export const EditDraft = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { data: response, isLoading, error } = useRequestDetails(id);
  const updateMutation = useUpdateRequest();

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    quantity: '',
    unit: '',
    deliveryLocation: '',
    expectedDate: ''
  });
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    if (response?.request) {
      const { title, description, quantity, unit, deliveryLocation, expectedDate } = response.request;
      setFormData({
        title: title || '',
        description: description || '',
        quantity: quantity || '',
        unit: unit || '',
        deliveryLocation: deliveryLocation || '',
        expectedDate: expectedDate ? new Date(expectedDate).toISOString().split('T')[0] : ''
      });
    }
  }, [response]);

  if (isLoading) return <div className="p-4">جاري التحميل...</div>;
  if (error || !response?.request) return <div className="p-4 text-red-500">حدث خطأ في جلب بيانات المسودة.</div>;

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSave = (e) => {
    e.preventDefault();
    setErrorMessage('');
    updateMutation.mutate({ id, data: formData }, {
      onSuccess: () => {
        navigate('/dashboard');
      },
      onError: (err) => {
        setErrorMessage('حدث خطأ أثناء الحفظ: ' + err.message);
      }
    });
  };

  return (
    <div className="max-w-2xl mx-auto bg-white p-6 rounded-lg shadow-md">
      <h2 className="text-2xl font-bold mb-6 text-gray-800">تعديل المسودة</h2>
      {errorMessage && (
        <div className="mb-4 p-3 bg-red-100 text-red-700 rounded-md">
          {errorMessage}
        </div>
      )}
      <form onSubmit={handleSave} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">العنوان</label>
          <input
            type="text"
            name="title"
            required
            value={formData.title}
            onChange={handleChange}
            className="w-full p-2 border border-gray-300 rounded focus:ring-indigo-500 focus:border-indigo-500"
          />
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">الوصف</label>
          <textarea
            name="description"
            rows="4"
            required
            value={formData.description}
            onChange={handleChange}
            className="w-full p-2 border border-gray-300 rounded focus:ring-indigo-500 focus:border-indigo-500"
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">الكمية</label>
            <input
              type="number"
              name="quantity"
              required
              min="1"
              value={formData.quantity}
              onChange={handleChange}
              className="w-full p-2 border border-gray-300 rounded focus:ring-indigo-500 focus:border-indigo-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">الوحدة</label>
            <input
              type="text"
              name="unit"
              required
              value={formData.unit}
              onChange={handleChange}
              className="w-full p-2 border border-gray-300 rounded focus:ring-indigo-500 focus:border-indigo-500"
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">مكان التوصيل</label>
            <input
              type="text"
              name="deliveryLocation"
              required
              value={formData.deliveryLocation}
              onChange={handleChange}
              className="w-full p-2 border border-gray-300 rounded focus:ring-indigo-500 focus:border-indigo-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">تاريخ التسليم المتوقع</label>
            <input
              type="date"
              name="expectedDate"
              required
              value={formData.expectedDate}
              onChange={handleChange}
              className="w-full p-2 border border-gray-300 rounded focus:ring-indigo-500 focus:border-indigo-500"
            />
          </div>
        </div>

        <div className="mt-6 flex justify-end gap-3">
          <Button type="button" variant="secondary" onClick={() => navigate('/dashboard')}>
            إلغاء
          </Button>
          <Button type="submit" isLoading={updateMutation.isPending}>
            حفظ التعديلات
          </Button>
        </div>
      </form>
    </div>
  );
};
