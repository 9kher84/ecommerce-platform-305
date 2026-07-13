import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useRequestDetails, useUpdateRequestStatus } from '../../hooks/queries/entityQueries';
import { useSubmitQuote, useQuotesForRequest } from '../../hooks/queries/quoteQueries';
import { Button } from '../../components/common/Button';
import { QuoteForm } from '../../components/quotes/QuoteForm';
import { QuoteCard } from '../../components/quotes/QuoteCard';
import { useAuth } from '../../providers/AuthProvider';

export const RequestDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { data: response, isLoading, isError, error } = useRequestDetails(id);
  const updateStatusMutation = useUpdateRequestStatus();
  const submitQuoteMutation = useSubmitQuote();
  const { data: quotesData } = useQuotesForRequest(id);
  
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
        Error loading details: {error?.message}
      </div>
    );
  }

  // The runtime audit states get request returns { success: true, data: Request } 
  // Note: getRequests list returns pagination, but getRequestDetails returns single object in data
  const request = response?.request || response?.data;

  if (!request) {
    return <div className="p-4 text-center text-gray-500">Request not found</div>;
  }

  const handleStatusChange = (newStatus) => {
    updateStatusMutation.mutate({ id: request.id, status: newStatus });
  };

  return (
    <div className="max-w-4xl mx-auto bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
      <div className="border-b border-gray-200 bg-gray-50 p-6 flex justify-between items-center">
        <div>
          <button onClick={() => navigate(-1)} className="text-sm text-indigo-600 hover:text-indigo-800 mb-2 inline-block">
            ← Back to Requests
          </button>
          <h1 className="text-2xl font-bold text-gray-900">{request.title}</h1>
          <p className="text-sm text-gray-500 mt-1">ID: {request.id}</p>
        </div>
        <div className="flex flex-col items-end gap-2">
          <span className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm font-semibold">
            {request.status.toUpperCase()}
          </span>
          <div className="flex gap-2">
            {request.status === 'pending' && (
              <Button size="sm" onClick={() => handleStatusChange('active')} isLoading={updateStatusMutation.isPending}>
                Approve (Active)
              </Button>
            )}
            {['pending', 'active'].includes(request.status) && (
              <Button variant="danger" size="sm" onClick={() => handleStatusChange('cancelled')} isLoading={updateStatusMutation.isPending}>
                Cancel
              </Button>
            )}
          </div>
        </div>
      </div>

      <div className="p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-2">Description</h3>
        <p className="text-gray-700 whitespace-pre-wrap mb-6">{request.description}</p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          <div className="bg-gray-50 p-4 rounded border border-gray-100">
            <h4 className="text-sm font-medium text-gray-500 mb-1">Category</h4>
            <p className="text-gray-900">{request.category || 'N/A'}</p>
          </div>
          <div className="bg-gray-50 p-4 rounded border border-gray-100">
            <h4 className="text-sm font-medium text-gray-500 mb-1">Target Price</h4>
            <p className="text-gray-900">{request.targetPrice ? `$${request.targetPrice}` : 'Open to offers'}</p>
          </div>
          <div className="bg-gray-50 p-4 rounded border border-gray-100">
            <h4 className="text-sm font-medium text-gray-500 mb-1">Created At</h4>
            <p className="text-gray-900">{new Date(request.createdAt).toLocaleString()}</p>
          </div>
          <div className="bg-gray-50 p-4 rounded border border-gray-100">
            <h4 className="text-sm font-medium text-gray-500 mb-1">Last Updated</h4>
            <p className="text-gray-900">{new Date(request.updatedAt).toLocaleString()}</p>
          </div>
        </div>
        
        {request.requirements && request.requirements.length > 0 && (
          <div>
            <h3 className="text-lg font-medium text-gray-900 mb-3">Specific Requirements</h3>
            <ul className="list-disc pl-5 space-y-1 text-gray-700">
              {request.requirements.map((req, idx) => (
                <li key={idx}>{req}</li>
              ))}
            </ul>
          </div>
        )}
      </div>

      {user?.role === 'seller' && ['active', 'published'].includes(request.status) && (
        <div className="p-6 border-t border-gray-200">
          <QuoteForm 
            onSubmit={(data) => {
              submitQuoteMutation.mutate({
                purchaseRequestId: request.id,
                price: data.price,
                deliveryDate: data.deliveryDate,
                notes: data.notes
              }, {
                onSuccess: () => alert('Quote submitted successfully!')
              });
            }}
            isLoading={submitQuoteMutation.isPending}
          />
        </div>
      )}

      {user?.role === 'buyer' && ['active', 'published', 'quoting'].includes(request.status) && quotesData?.quotes?.length > 0 && (
        <div className="p-6 border-t border-gray-200">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Received Quotes</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {quotesData.quotes.map(quote => (
              <QuoteCard key={quote.id} quote={quote} role="buyer" />
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
