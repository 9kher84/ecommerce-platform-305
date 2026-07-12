import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useQuoteAction, useNegotiateQuote } from '../../hooks/queries/quoteQueries';
import { Button } from '../../components/common/Button';
import { Input } from '../../components/common/Input';
import { useAuth } from '../../providers/AuthProvider';

export const QuoteDetails = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();
  
  // Since there is no GET /api/quotes/:id backend endpoint, we rely on router state
  const quote = location.state?.quote;

  const [counterPrice, setCounterPrice] = useState('');
  const [showCounter, setShowCounter] = useState(false);

  const acceptMutation = useQuoteAction('accept');
  const rejectMutation = useQuoteAction('reject');
  const withdrawMutation = useQuoteAction('withdraw');
  const respondMutation = useQuoteAction('respond');
  const negotiateMutation = useNegotiateQuote();

  if (!quote) {
    return (
      <div className="max-w-3xl mx-auto p-12 text-center">
        <h2 className="text-xl font-bold text-gray-900 mb-4">Quote Details Not Found</h2>
        <p className="text-gray-600 mb-6">
          Direct navigation to a quote is not supported by the current backend contract. 
          Please navigate from the lists.
        </p>
        <Button onClick={() => navigate(-1)}>Go Back</Button>
      </div>
    );
  }

  const isBuyer = user?.role === 'buyer';
  const isSeller = user?.role === 'seller';

  const handleNegotiate = () => {
    negotiateMutation.mutate({ id: quote.id, data: { price: Number(counterPrice) } }, {
      onSuccess: () => {
        setShowCounter(false);
        navigate(-1);
      }
    });
  };

  const handleRespond = (action) => {
    respondMutation.mutate({ id: quote.id, data: { action, price: Number(counterPrice) } }, {
      onSuccess: () => {
        setShowCounter(false);
        navigate(-1);
      }
    });
  };

  return (
    <div className="max-w-4xl mx-auto bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
      <div className="border-b border-gray-200 bg-gray-50 p-6 flex justify-between items-center">
        <div>
          <button onClick={() => navigate(-1)} className="text-sm text-indigo-600 hover:text-indigo-800 mb-2 inline-block">
            ← Back
          </button>
          <h1 className="text-2xl font-bold text-gray-900">Quote #{quote.id.substring(0, 8)}</h1>
        </div>
        <div>
          <span className="px-3 py-1 bg-gray-200 text-gray-800 rounded-full text-sm font-semibold">
            {quote.status.toUpperCase()}
          </span>
        </div>
      </div>

      <div className="p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          <div className="bg-gray-50 p-4 rounded border border-gray-100">
            <h4 className="text-sm font-medium text-gray-500 mb-1">Current Price</h4>
            <p className="text-2xl font-bold text-gray-900">${quote.price}</p>
          </div>
          <div className="bg-gray-50 p-4 rounded border border-gray-100">
            <h4 className="text-sm font-medium text-gray-500 mb-1">Delivery Date</h4>
            <p className="text-gray-900 font-medium">
              {quote.deliveryDate ? new Date(quote.deliveryDate).toLocaleDateString() : 'TBD'}
            </p>
          </div>
        </div>

        {/* Actions based on role and status */}
        <div className="border-t pt-6 mt-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Actions</h3>
          
          <div className="flex flex-wrap gap-4">
            {isBuyer && ['pending', 'negotiating'].includes(quote.status) && (
              <>
                <Button onClick={() => acceptMutation.mutate(quote.id)} isLoading={acceptMutation.isPending}>
                  Accept Quote
                </Button>
                <Button variant="secondary" onClick={() => setShowCounter(true)}>
                  Counter Offer
                </Button>
                <Button variant="danger" onClick={() => rejectMutation.mutate(quote.id)} isLoading={rejectMutation.isPending}>
                  Reject
                </Button>
              </>
            )}

            {isSeller && ['pending', 'negotiating'].includes(quote.status) && (
              <>
                {quote.status === 'negotiating' && (
                  <>
                    <Button onClick={() => handleRespond('accept')} isLoading={respondMutation.isPending}>
                      Accept Counter
                    </Button>
                    <Button variant="secondary" onClick={() => setShowCounter(true)}>
                      Counter Again
                    </Button>
                  </>
                )}
                <Button variant="danger" onClick={() => withdrawMutation.mutate(quote.id)} isLoading={withdrawMutation.isPending}>
                  Withdraw Quote
                </Button>
              </>
            )}
          </div>

          {showCounter && (
            <div className="mt-6 p-4 bg-gray-50 border border-gray-200 rounded-md">
              <h4 className="text-md font-medium text-gray-900 mb-3">Submit Counter Offer</h4>
              <div className="flex gap-4 items-end">
                <div className="flex-1">
                  <Input 
                    id="counterPrice" 
                    label="Counter Price ($)" 
                    type="number"
                    value={counterPrice}
                    onChange={(e) => setCounterPrice(e.target.value)}
                  />
                </div>
                <Button 
                  onClick={isBuyer ? handleNegotiate : () => handleRespond('counter')}
                  isLoading={isBuyer ? negotiateMutation.isPending : respondMutation.isPending}
                  disabled={!counterPrice}
                >
                  Submit
                </Button>
                <Button variant="secondary" onClick={() => setShowCounter(false)}>Cancel</Button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
