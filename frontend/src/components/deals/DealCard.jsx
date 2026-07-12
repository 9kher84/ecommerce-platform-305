import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../providers/AuthProvider';

export const DealCard = ({ deal }) => {
  const { user } = useAuth();
  const isBuyer = user?.id === deal.buyerId;

  const statusColors = {
    pending: 'bg-yellow-100 text-yellow-800',
    active: 'bg-green-100 text-green-800',
    completed: 'bg-blue-100 text-blue-800',
    cancelled: 'bg-red-100 text-red-800'
  };

  const statusClass = statusColors[deal.status] || 'bg-gray-100 text-gray-800';
  const partnerName = isBuyer ? deal.seller?.businessName || deal.seller?.name : deal.buyer?.name;
  const roleText = isBuyer ? 'Seller' : 'Buyer';

  return (
    <div className="bg-white border border-gray-200 rounded-lg shadow-sm hover:shadow-md transition-shadow p-5 flex flex-col justify-between h-full">
      <div>
        <div className="flex justify-between items-start mb-4">
          <div>
            <h3 className="text-lg font-bold text-gray-900 mb-1">
              Deal #{deal.id.substring(0, 8)}
            </h3>
            {deal.purchaseRequest && (
              <p className="text-sm text-gray-500">
                Request: {deal.purchaseRequest.title}
              </p>
            )}
          </div>
          <span className={`text-xs font-semibold px-2.5 py-0.5 rounded-full ${statusClass}`}>
            {deal.status.toUpperCase()}
          </span>
        </div>
        
        <div className="bg-gray-50 p-4 rounded-md border border-gray-100 mb-4">
          <div className="flex flex-col gap-2">
            <div>
              <span className="text-xs font-medium text-gray-500">{roleText}: </span>
              <span className="text-sm font-semibold text-gray-900">{partnerName}</span>
            </div>
            {deal.priceQuote && (
              <div>
                <span className="text-xs font-medium text-gray-500">Agreed Price: </span>
                <span className="text-sm font-semibold text-gray-900">${deal.priceQuote.price}</span>
              </div>
            )}
          </div>
        </div>
      </div>
      
      <div className="mt-auto border-t pt-4 flex justify-between items-center">
        <span className="text-xs text-gray-400">
          Date: {new Date(deal.createdAt).toLocaleDateString()}
        </span>
        <Link 
          to={`/deals/${deal.id}`}
          className="text-indigo-600 hover:text-indigo-800 font-medium text-sm"
        >
          View Contract →
        </Link>
      </div>
    </div>
  );
};
