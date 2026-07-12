import React, { useState } from 'react';
import { useMyQuotes } from '../../hooks/queries/quoteQueries';
import { QuoteCard } from '../../components/quotes/QuoteCard';
import { useAuth } from '../../providers/AuthProvider';

export const QuotesList = () => {
  const [status, setStatus] = useState('');
  const { data, isLoading, isError, error } = useMyQuotes(status);
  const { user } = useAuth();

  const quotes = data?.quotes || [];

  return (
    <div className="max-w-7xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-900">My Submitted Quotes</h1>
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
          <option value="negotiating">Negotiating</option>
          <option value="accepted">Accepted</option>
          <option value="rejected">Rejected</option>
          <option value="withdrawn">Withdrawn</option>
        </select>
      </div>

      {isLoading ? (
        <div className="flex justify-center p-12">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-indigo-600"></div>
        </div>
      ) : isError ? (
        <div className="bg-red-50 text-red-700 p-4 rounded-md">
          Error loading quotes: {error?.message}
        </div>
      ) : (
        <>
          {quotes.length === 0 ? (
            <div className="bg-white border border-gray-200 rounded-lg p-12 text-center text-gray-500">
              No quotes found.
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
              {quotes.map(quote => (
                <QuoteCard key={quote.id} quote={quote} role={user?.role} />
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
};
