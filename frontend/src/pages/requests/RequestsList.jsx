import React, { useState } from 'react';
import { useRequests } from '../../hooks/queries/entityQueries';
import { RequestCard } from '../../components/requests/RequestCard';
import { RequestFilters } from '../../components/requests/RequestFilters';
import { Button } from '../../components/common/Button';

export const RequestsList = () => {
  const [params, setParams] = useState({ page: 1, limit: 10, search: '', status: '' });
  
  const { data, isLoading, isError, error } = useRequests(params);

  const handleFilterChange = (newFilters) => {
    setParams(prev => ({ ...prev, ...newFilters, page: 1 }));
  };

  const handlePageChange = (newPage) => {
    setParams(prev => ({ ...prev, page: newPage }));
  };

  // The runtime audit verified that the backend returns: { success: true, data: [...], pagination: { ... }, count: X }
  const requests = data?.data || [];
  const pagination = data?.pagination || { current: 1, total: 1, count: 0 };

  return (
    <div className="max-w-7xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Purchase Requests</h1>
      </div>

      <RequestFilters onFilterChange={handleFilterChange} />

      {isLoading ? (
        <div className="flex justify-center p-12">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-indigo-600"></div>
        </div>
      ) : isError ? (
        <div className="bg-red-50 text-red-700 p-4 rounded-md">
          Error loading requests: {error?.message}
        </div>
      ) : (
        <>
          {requests.length === 0 ? (
            <div className="bg-white border border-gray-200 rounded-lg p-12 text-center text-gray-500">
              No requests found matching your criteria.
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
              {requests.map(req => (
                <RequestCard key={req.id} request={req} />
              ))}
            </div>
          )}

          {pagination.total > 1 && (
            <div className="flex justify-center gap-2 items-center bg-white p-4 rounded-md shadow-sm border border-gray-200">
              <Button 
                variant="secondary" 
                disabled={pagination.current === 1}
                onClick={() => handlePageChange(pagination.current - 1)}
              >
                Previous
              </Button>
              <span className="text-sm text-gray-600 font-medium px-4">
                Page {pagination.current} of {pagination.total}
              </span>
              <Button 
                variant="secondary" 
                disabled={pagination.current === pagination.total}
                onClick={() => handlePageChange(pagination.current + 1)}
              >
                Next
              </Button>
            </div>
          )}
        </>
      )}
    </div>
  );
};
