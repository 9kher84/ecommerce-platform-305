import React from 'react';

export const MatchCard = ({ matchData }) => {
  return (
    <div className="bg-white border border-gray-200 rounded-lg shadow-sm p-4 hover:shadow-md transition-shadow">
      <div className="flex justify-between items-start mb-2">
        <h3 className="text-lg font-semibold text-gray-900 line-clamp-2">
          {matchData.requestTitle}
        </h3>
        <span className="bg-indigo-100 text-indigo-800 text-xs font-medium px-2.5 py-0.5 rounded">
          {matchData.matches?.length || 0} Matches
        </span>
      </div>
      <p className="text-sm text-gray-500 mb-4">Request ID: {matchData.requestId}</p>
      
      {matchData.matches && matchData.matches.length > 0 ? (
        <ul className="space-y-3">
          {matchData.matches.map((item, idx) => (
            <li key={idx} className="flex flex-col bg-gray-50 p-3 rounded-md border border-gray-100">
              <div className="flex justify-between">
                <span className="font-medium text-gray-800">Match Score</span>
                <span className="text-green-600 font-bold">{Math.round(item.score * 100)}%</span>
              </div>
              {item.opportunity && (
                <div className="text-sm text-gray-600 mt-1">
                  Type: {item.opportunity.type}
                </div>
              )}
            </li>
          ))}
        </ul>
      ) : (
        <p className="text-sm text-gray-400 italic">No exact matches yet.</p>
      )}
    </div>
  );
};
