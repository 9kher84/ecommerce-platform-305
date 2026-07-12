import React, { useState } from 'react';
import { useDeals } from '../../hooks/queries/dealQueries';
import { DealCard } from '../../components/deals/DealCard';

export const DealsList = () => {
  const [status, setStatus] = useState('');
  const { data, isLoading, isError, error } = useDeals(status);

  const deals = data?.deals || [];

  return (
    <div className="max-w-7xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Agreements & Deals</h1>
      </div>

      <div className="mb-6">
        <label htmlFor="status" className="block text-sm font-medium text-gray-700 mb-1">
          Filter by Status
        </label>
        <select
          id="status"
          value={status}
          onChange={(e) => setStatus(e.target.value)}
          className="block w-full sm:w-48 px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
        >
          <option value="">All Statuses</option>
          <option value="pending">Pending</option>
          <option value="active">Active</option>
          <option value="completed">Completed</option>
          <option value="cancelled">Cancelled</option>
        </select>
      </div>

      {isLoading ? (
        <div className="flex justify-center p-12">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-indigo-600"></div>
        </div>
      ) : isError ? (
        <div className="bg-red-50 text-red-700 p-4 rounded-md">
          Error loading deals: {error?.message}
        </div>
      ) : (
        <>
          {deals.length === 0 ? (
            <div className="bg-white border border-gray-200 rounded-lg p-12 text-center text-gray-500">
              No deals found.
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
              {deals.map(deal => (
                <DealCard key={deal.id} deal={deal} />
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
};
