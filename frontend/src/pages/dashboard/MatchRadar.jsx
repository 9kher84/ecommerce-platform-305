import React from 'react';
import { useMatchRadar } from '../../hooks/queries/dashboardQueries';
import { MatchCard } from '../../components/dashboard/MatchCard';

export const MatchRadar = () => {
  const { data: radarResponse, isLoading, isError, error } = useMatchRadar();

  if (isLoading) {
    return (
      <div className="flex justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="bg-red-50 text-red-700 p-4 rounded-md">
        Error loading radar: {error?.message}
      </div>
    );
  }

  // API response is { success: true, data: [...] }
  const matches = radarResponse?.data || [];

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900">رادار المطابقات (Match Radar)</h2>
        <p className="mt-1 text-sm text-gray-500">
          يعرض الرادار الفرص المطابقة لطلباتك ومنتجاتك بناءً على خوارزميات الذكاء الاصطناعي.
        </p>
      </div>

      {matches.length === 0 ? (
        <div className="bg-white border border-gray-200 rounded-lg p-8 text-center text-gray-500">
          لا توجد مطابقات حالياً.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {matches.map((matchData) => (
            <MatchCard key={matchData.requestId} matchData={matchData} />
          ))}
        </div>
      )}
    </div>
  );
};
