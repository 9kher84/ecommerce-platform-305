import React from 'react';
import { Link } from 'react-router-dom';

export const RequestCard = ({ request }) => {
  const statusColors = {
    pending: 'bg-yellow-100 text-yellow-800',
    active: 'bg-green-100 text-green-800',
    fulfilled: 'bg-blue-100 text-blue-800',
    cancelled: 'bg-red-100 text-red-800'
  };

  const statusClass = statusColors[request.status] || 'bg-gray-100 text-gray-800';

  return (
    <div className="bg-white border border-gray-200 rounded-lg shadow-sm hover:shadow-md transition-shadow p-5 flex flex-col justify-between">
      <div>
        <div className="flex justify-between items-start mb-2">
          <h3 className="text-lg font-bold text-gray-900 line-clamp-1" title={request.title}>
            {request.title}
          </h3>
          <span className={`text-xs font-semibold px-2.5 py-0.5 rounded-full ${statusClass}`}>
            {request.status.toUpperCase()}
          </span>
        </div>
        <p className="text-sm text-gray-600 line-clamp-2 mb-4">
          {request.description}
        </p>
        
        <div className="grid grid-cols-2 gap-2 text-sm text-gray-500 mb-4">
          <div>
            <span className="block font-medium text-gray-700">Category</span>
            {request.category || 'N/A'}
          </div>
          <div>
            <span className="block font-medium text-gray-700">Target Price</span>
            {request.targetPrice ? `$${request.targetPrice}` : 'Open'}
          </div>
        </div>
      </div>
      
      <div className="mt-auto border-t pt-4 flex justify-between items-center">
        <span className="text-xs text-gray-400">
          Created: {new Date(request.createdAt).toLocaleDateString()}
        </span>
        <Link 
          to={request.status === 'draft' ? `/intake/${request.id}?step=2` : `/requests/${request.id}`}
          className="text-indigo-600 hover:text-indigo-800 font-medium text-sm"
        >
          {request.status === 'draft' ? 'مراجعة ونشر المسودة ←' : 'View Details →'}
        </Link>
      </div>
    </div>
  );
};
