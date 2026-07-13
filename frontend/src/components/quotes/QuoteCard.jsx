import React from 'react';
import { Link } from 'react-router-dom';

export const QuoteCard = ({ quote, role }) => {
  const statusColors = {
    pending: 'bg-yellow-100 text-yellow-800',
    negotiating: 'bg-blue-100 text-blue-800',
    accepted: 'bg-green-100 text-green-800',
    rejected: 'bg-red-100 text-red-800',
    withdrawn: 'bg-gray-100 text-gray-800'
  };

  const statusClass = statusColors[quote.status] || 'bg-gray-100 text-gray-800';

  return (
    <div className="bg-white border border-gray-200 rounded-lg shadow-sm hover:shadow-md transition-shadow p-5 flex flex-col justify-between h-full">
      <div>
        <div className="flex justify-between items-start mb-4">
          <div>
            <h3 className="text-lg font-bold text-gray-900 mb-1">
              Quote #{quote.id.substring(0, 8)}
            </h3>
            {role === 'seller' && quote.request && (
              <p className="text-sm text-gray-500">
                For Request: {quote.request.title}
              </p>
            )}
            {role === 'buyer' && quote.seller && (
              <p className="text-sm text-gray-500">
                From Seller: {quote.seller.name || quote.seller.email}
              </p>
            )}
          </div>
          <span className={`text-xs font-semibold px-2.5 py-0.5 rounded-full ${statusClass}`}>
            {quote.status.toUpperCase()}
          </span>
        </div>
        
        <div className="bg-gray-50 p-4 rounded-md border border-gray-100 mb-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <span className="block text-xs font-medium text-gray-500 mb-1">Price</span>
              <span className="text-lg font-bold text-gray-900">${quote.price}</span>
            </div>
            <div>
              <span className="block text-xs font-medium text-gray-500 mb-1">Delivery Date</span>
              <span className="text-sm font-medium text-gray-700">
                {quote.deliveryDate ? new Date(quote.deliveryDate).toLocaleDateString() : 'TBD'}
              </span>
            </div>
          </div>
        </div>
      </div>
      
      <div className="mt-auto border-t pt-4 flex justify-between items-center">
        <span className="text-xs text-gray-400">
          Submitted: {new Date(quote.createdAt).toLocaleDateString()}
        </span>
        <Link 
          to={`/quotes/${quote.id}`}
          state={{ quote }}
          className="text-indigo-600 hover:text-indigo-800 font-medium text-sm"
        >
          View Negotiation →
        </Link>
      </div>
    </div>
  );
};
