import React, { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { commercialService } from '../../services/commercialService';
import { toast } from 'react-hot-toast';
import { Button } from '../common/Button';
import { Input } from '../common/Input';

export const SubmitProposalModal = ({ workPackageId, isOpen, onClose }) => {
  const queryClient = useQueryClient();
  const [formData, setFormData] = useState({
    price: '',
    deliveryDays: '',
    notes: '',
    validUntil: ''
  });

  const submitProposalMutation = useMutation({
    mutationFn: (data) => commercialService.submitInitialProposal(workPackageId, data),
    onSuccess: () => {
      toast.success('تم تقديم العرض بنجاح');
      queryClient.invalidateQueries({ queryKey: ['requests'] });
      onClose();
    },
    onError: (error) => {
      toast.error(error.message || 'فشل تقديم العرض');
    }
  });

  if (!isOpen) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.price || !formData.deliveryDays) {
      toast.error('يرجى تعبئة السعر ومدة التسليم');
      return;
    }
    
    submitProposalMutation.mutate({
      terms: {
        price: parseFloat(formData.price),
        deliveryDays: parseInt(formData.deliveryDays, 10)
      },
      notes: formData.notes,
      validUntil: formData.validUntil || null
    });
  };

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50 flex items-center justify-center">
      <div className="relative mx-auto p-5 border w-full max-w-md shadow-lg rounded-md bg-white">
        <div className="mt-3 text-center sm:mt-0 sm:text-right">
          <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">
            تقديم عرض السعر
          </h3>
          <form onSubmit={handleSubmit} className="space-y-4">
            <Input
              id="price"
              label="السعر الإجمالي (ريال)"
              type="number"
              min="1"
              value={formData.price}
              onChange={(e) => setFormData({ ...formData, price: e.target.value })}
              required
            />
            <Input
              id="deliveryDays"
              label="مدة التسليم (أيام)"
              type="number"
              min="1"
              value={formData.deliveryDays}
              onChange={(e) => setFormData({ ...formData, deliveryDays: e.target.value })}
              required
            />
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                ملاحظات (اختياري)
              </label>
              <textarea
                className="w-full border border-gray-300 rounded-md p-2 focus:ring-indigo-500 focus:border-indigo-500"
                rows="3"
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              ></textarea>
            </div>
            <Input
              id="validUntil"
              label="صالح حتى (اختياري)"
              type="date"
              value={formData.validUntil}
              onChange={(e) => setFormData({ ...formData, validUntil: e.target.value })}
            />
            
            <div className="flex justify-end gap-3 mt-6">
              <Button variant="secondary" onClick={onClose} type="button">
                إلغاء
              </Button>
              <Button type="submit" isLoading={submitProposalMutation.isPending}>
                تأكيد العرض
              </Button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};
