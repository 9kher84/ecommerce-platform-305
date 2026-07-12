import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useDealDetails, useUpdateDealStatus } from '../../hooks/queries/dealQueries';
import { Button } from '../../components/common/Button';
import { PaymentTermsForm } from '../../components/deals/PaymentTermsForm';
import { useAuth } from '../../providers/AuthProvider';

export const DealContract = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  
  const { data: response, isLoading, isError, error } = useDealDetails(id);
  const updateMutation = useUpdateDealStatus();
  
  const [showNotesForm, setShowNotesForm] = useState(false);

  if (isLoading) {
    return (
      <div className="flex justify-center p-12">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="bg-red-50 text-red-700 p-4 rounded-md">
        Error loading contract: {error?.message}
      </div>
    );
  }

  const deal = response?.deal;

  if (!deal) {
    return <div className="p-4 text-center text-gray-500">Deal not found</div>;
  }

  const isBuyer = user?.id === deal.buyerId;
  const partnerName = isBuyer ? deal.seller?.businessName || deal.seller?.name : deal.buyer?.name;
  const roleText = isBuyer ? 'Seller' : 'Buyer';

  const handleStatusUpdate = (status) => {
    updateMutation.mutate({ id: deal.id, data: { status } });
  };

  const handleNotesUpdate = (notes) => {
    updateMutation.mutate({ id: deal.id, data: { status: deal.status, notes } }, {
      onSuccess: () => setShowNotesForm(false)
    });
  };

  return (
    <div className="max-w-4xl mx-auto bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
      <div className="border-b border-gray-200 bg-gray-50 p-6 flex justify-between items-center">
        <div>
          <button onClick={() => navigate(-1)} className="text-sm text-indigo-600 hover:text-indigo-800 mb-2 inline-block">
            ← Back to Deals
          </button>
          <h1 className="text-2xl font-bold text-gray-900">Contract #{deal.id.substring(0, 8)}</h1>
        </div>
        <div>
          <span className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm font-semibold">
            {deal.status.toUpperCase()}
          </span>
        </div>
      </div>

      <div className="p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
          <div>
            <h3 className="text-lg font-medium text-gray-900 mb-4">Deal Information</h3>
            <div className="space-y-3">
              <div className="bg-gray-50 p-3 rounded border border-gray-100">
                <span className="text-sm text-gray-500 block">Related Request</span>
                <span className="font-medium text-gray-900">{deal.purchaseRequest?.title || 'N/A'}</span>
              </div>
              <div className="bg-gray-50 p-3 rounded border border-gray-100">
                <span className="text-sm text-gray-500 block">Agreed Price</span>
                <span className="font-medium text-gray-900">${deal.priceQuote?.price || 'N/A'}</span>
              </div>
              <div className="bg-gray-50 p-3 rounded border border-gray-100">
                <span className="text-sm text-gray-500 block">Created At</span>
                <span className="font-medium text-gray-900">{new Date(deal.createdAt).toLocaleString()}</span>
              </div>
            </div>
          </div>

          <div>
            <h3 className="text-lg font-medium text-gray-900 mb-4">Partner Details ({roleText})</h3>
            <div className="space-y-3">
              <div className="bg-gray-50 p-3 rounded border border-gray-100">
                <span className="text-sm text-gray-500 block">Name / Business</span>
                <span className="font-medium text-gray-900">{partnerName}</span>
              </div>
              <div className="bg-gray-50 p-3 rounded border border-gray-100">
                <span className="text-sm text-gray-500 block">Email</span>
                <span className="font-medium text-gray-900">{isBuyer ? deal.seller?.email : deal.buyer?.email}</span>
              </div>
              <div className="bg-gray-50 p-3 rounded border border-gray-100">
                <span className="text-sm text-gray-500 block">Contact</span>
                <span className="font-medium text-gray-900">{isBuyer ? deal.seller?.mobile : deal.buyer?.mobile || 'Not provided'}</span>
              </div>
            </div>
          </div>
        </div>

        <div className="mb-8">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-medium text-gray-900">Contract Terms & Notes</h3>
            {!showNotesForm && (
              <Button variant="secondary" size="sm" onClick={() => setShowNotesForm(true)}>
                Edit Terms
              </Button>
            )}
          </div>
          
          {showNotesForm ? (
            <PaymentTermsForm onSubmit={handleNotesUpdate} isLoading={updateMutation.isPending} />
          ) : (
            <div className="bg-gray-50 p-4 rounded-lg border border-gray-200 min-h-[100px] whitespace-pre-wrap">
              {deal.notes || <span className="text-gray-400 italic">No specific terms or notes added yet.</span>}
            </div>
          )}
        </div>

        <div className="border-t pt-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Actions</h3>
          <div className="flex gap-4">
            {deal.status === 'pending' && (
              <Button onClick={() => handleStatusUpdate('active')} isLoading={updateMutation.isPending}>
                Activate Deal
              </Button>
            )}
            {deal.status === 'active' && (
              <Button onClick={() => handleStatusUpdate('completed')} isLoading={updateMutation.isPending}>
                Mark Completed
              </Button>
            )}
            {['pending', 'active'].includes(deal.status) && (
              <Button variant="danger" onClick={() => handleStatusUpdate('cancelled')} isLoading={updateMutation.isPending}>
                Cancel Deal
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
