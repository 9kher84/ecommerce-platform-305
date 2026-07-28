import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useCommercialTimeline, useSubmitRevision, useAcceptRevision } from '../../hooks/queries/commercialQueries';
import { useAuth } from '../../providers/AuthProvider';

export const CommercialProcessPage = () => {
  const { id, packageId, processId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [activeTab, setActiveTab] = useState('timeline');
  const [showCounterForm, setShowCounterForm] = useState(false);
  const [formTerms, setFormTerms] = useState({});

  // Fetch real timeline data
  const { data: response, isLoading, isError } = useCommercialTimeline(processId);
  const submitRevisionMutation = useSubmitRevision();
  const acceptRevisionMutation = useAcceptRevision();

  if (isLoading) return <div className="p-8 text-center">Loading Timeline...</div>;
  if (isError) return <div className="p-8 text-center text-red-500">Error loading Timeline.</div>;

  const process = response?.data;
  if (!process) return <div className="p-8 text-center">Process not found.</div>;

  const revisions = process.negotiationSheets || [];
  const latestRevision = revisions.length > 0 ? revisions[revisions.length - 1] : null;

  const getAuthorId = (initiatorPartyId) => {
    const party = process.parties?.find(p => p.id === initiatorPartyId);
    return party ? party.userId : null;
  };

  // Determine if it's the current user's turn
  // If the last author is NOT the current user, it's their turn to respond.
  // Exception: if status is 'awarded', 'pending_award', 'expired', 'closed' - no one's turn.
  const isProcessActive = !['pending_award', 'awarded', 'expired', 'closed', 'cancelled'].includes(process.status);
  const isMyTurn = isProcessActive && latestRevision && getAuthorId(latestRevision.initiatorPartyId) !== user?.id;

  const handleOpenCounter = () => {
    // Clone previous terms for easy editing
    setFormTerms({ ...latestRevision?.terms });
    setShowCounterForm(true);
  };

  const handleAccept = () => {
    acceptRevisionMutation.mutate(processId, {
      onSuccess: () => {
        alert("Offer Accepted! Moved to Pending Awards Inbox.");
        navigate('/inbox');
      }
    });
  };

  const handleSubmitCounter = () => {
    submitRevisionMutation.mutate({
      processId,
      payload: { terms: formTerms, decision: 'COUNTER' }
    }, {
      onSuccess: () => {
        setShowCounterForm(false);
        alert("Counter Submitted");
      }
    });
  };

  return (
    <div className="max-w-7xl mx-auto flex flex-col md:flex-row gap-6">
      
      {/* Main Content (Left 75%) */}
      <div className="flex-1 space-y-6">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
          
          {/* Header */}
          <div className="bg-gray-50 border-b border-gray-200 p-6">
            <button onClick={() => navigate(-1)} className="text-sm text-indigo-600 hover:text-indigo-800 mb-2 inline-block">
              ← عودة للمصفوفة
            </button>
            <div className="flex justify-between items-start">
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Commercial Process #{process.id.substring(0,8)}</h1>
                <p className="text-sm text-gray-500 mt-1">Status: {process.status.toUpperCase()}</p>
              </div>
              {isProcessActive ? (
                <span className={`px-4 py-2 rounded-lg text-sm font-bold ${isMyTurn ? 'bg-green-100 text-green-800' : 'bg-blue-100 text-blue-800'}`}>
                  {isMyTurn ? 'بانتظار قرارك' : 'بانتظار الطرف الآخر'}
                </span>
              ) : (
                <span className={`px-4 py-2 rounded-lg text-sm font-bold bg-gray-100 text-gray-800`}>
                  العملية مغلقة ({process.status})
                </span>
              )}
            </div>
          </div>

          {/* Tabs */}
          <div className="flex border-b border-gray-200">
            {['timeline', 'documents', 'history', 'activity'].map(tab => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-6 py-3 font-medium text-sm border-b-2 transition-colors ${
                  activeTab === tab ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                {tab.charAt(0).toUpperCase() + tab.slice(1)}
              </button>
            ))}
          </div>

          {/* Tab Content */}
          <div className="p-6 bg-gray-50 min-h-[500px]">
            {activeTab === 'timeline' && (
              <div className="space-y-8 relative before:absolute before:inset-0 before:ml-5 before:-translate-x-px md:before:mx-auto md:before:translate-x-0 before:h-full before:w-0.5 before:bg-gradient-to-b before:from-transparent before:via-gray-300 before:to-transparent">
                
                {revisions.map((rev) => (
                  <div key={rev.version} className={`relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group is-active`}>
                    
                    {/* Icon */}
                    <div className="flex items-center justify-center w-10 h-10 rounded-full border border-white bg-white shadow shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2 z-10">
                      <span className={`w-3 h-3 rounded-full ${getAuthorId(rev.initiatorPartyId) === user?.id ? 'bg-indigo-600' : 'bg-orange-500'}`}></span>
                    </div>

                    {/* Card */}
                    <div className="w-[calc(100%-4rem)] md:w-[calc(50%-2.5rem)] bg-white p-4 rounded border border-gray-200 shadow-sm">
                      <div className="flex justify-between items-center mb-2">
                        <span className="font-bold text-gray-900">{getAuthorId(rev.initiatorPartyId) === user?.id ? 'You' : `User ${getAuthorId(rev.initiatorPartyId)?.substring(0,5) || 'Unknown'}`}</span>
                        <span className="text-xs text-gray-500 font-mono">{new Date(rev.createdAt).toLocaleString()}</span>
                      </div>
                      <div className="text-sm font-bold text-indigo-600 mb-3">
                        Revision {rev.version} ({rev.decision})
                      </div>
                      
                      {/* Git-like Diff View */}
                      {rev.changeSet && Object.keys(rev.changeSet).length > 0 ? (
                        <div className="bg-gray-50 rounded border border-gray-100 p-3 font-mono text-xs space-y-1">
                          {Object.entries(rev.changeSet).map(([key, diff]) => (
                            <div key={key} className="flex justify-between border-b border-gray-100 last:border-0 pb-1 last:pb-0">
                              <span className="text-gray-500 w-24">{key}:</span>
                              <span className="text-red-600 line-through mr-2">{diff.from}</span>
                              <span className="text-gray-400">→</span>
                              <span className="text-green-600 font-bold ml-2">{diff.to}</span>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="bg-gray-50 rounded border border-gray-100 p-3 font-mono text-xs space-y-1 text-gray-700">
                          {Object.entries(rev.terms || {}).map(([key, val]) => (
                            <div key={key} className="flex justify-between border-b border-gray-100 last:border-0 pb-1 last:pb-0">
                              <span className="text-gray-500 w-24">{key}:</span>
                              <span className="font-bold">{val}</span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                ))}

                {/* Actions Panel */}
                {isMyTurn && !showCounterForm && (
                  <div className="relative flex items-center justify-center z-10 mt-8">
                    <div className="bg-white p-4 rounded-lg border-2 border-dashed border-indigo-200 flex gap-4 shadow-sm">
                      <button onClick={handleAccept} disabled={acceptRevisionMutation.isPending} className="px-6 py-2 bg-green-600 text-white font-bold rounded hover:bg-green-700 disabled:opacity-50">Accept Offer</button>
                      <button onClick={handleOpenCounter} className="px-6 py-2 bg-indigo-600 text-white font-bold rounded hover:bg-indigo-700">Counter (Clone)</button>
                      <button className="px-6 py-2 bg-red-100 text-red-700 font-bold rounded hover:bg-red-200">Reject</button>
                    </div>
                  </div>
                )}

                {/* Counter Form (Clone) */}
                {showCounterForm && (
                  <div className="relative flex items-center justify-center z-10 mt-8">
                    <div className="bg-white p-6 rounded-lg border border-indigo-200 shadow-lg w-full max-w-md">
                      <h3 className="font-bold text-gray-900 mb-4">Counter Offer (Draft Revision {(latestRevision?.version || 0) + 1})</h3>
                      <div className="space-y-4 font-mono text-sm">
                        {Object.keys(formTerms).map(key => (
                          <div key={key}>
                            <label className="block text-gray-500 mb-1">{key}</label>
                            <input 
                              type="text" 
                              className="w-full border border-gray-300 rounded p-2 focus:ring-indigo-500 focus:border-indigo-500"
                              value={formTerms[key]}
                              onChange={(e) => setFormTerms({...formTerms, [key]: e.target.value})}
                            />
                          </div>
                        ))}
                      </div>
                      <div className="flex gap-2 mt-6">
                        <button onClick={() => setShowCounterForm(false)} className="flex-1 py-2 bg-gray-100 text-gray-700 font-bold rounded hover:bg-gray-200">Cancel</button>
                        <button onClick={handleSubmitCounter} disabled={submitRevisionMutation.isPending} className="flex-1 py-2 bg-indigo-600 text-white font-bold rounded hover:bg-indigo-700 disabled:opacity-50">Submit Revision</button>
                      </div>
                    </div>
                  </div>
                )}
                
              </div>
            )}
            {activeTab !== 'timeline' && <div className="text-center text-gray-500 mt-10">Under Construction</div>}
          </div>
        </div>
      </div>

      {/* Assistant Panel (Right 25%) */}
      <div className="w-full md:w-80 space-y-4">
        <div className="bg-gradient-to-b from-indigo-50 to-white rounded-lg shadow-sm border border-indigo-100 p-4 h-full min-h-[600px]">
          <div className="flex items-center gap-2 mb-6 pb-4 border-b border-indigo-100">
            <span className="text-2xl">🤖</span>
            <h2 className="font-bold text-indigo-900">Commercial Assistant</h2>
          </div>
          
          <div className="space-y-3">
            <div className="bg-white p-3 rounded border border-indigo-50 shadow-sm text-sm text-gray-700">
              <strong className="text-indigo-600 block mb-1">Insight:</strong>
              No active insights for this process yet. Connect AI Engine to generate recommendations.
            </div>
            {process.status === 'expired' && (
              <div className="bg-white p-3 rounded border border-indigo-50 shadow-sm text-sm text-gray-700">
                <strong className="text-red-600 block mb-1">Alert:</strong>
                This offer has expired.
              </div>
            )}
          </div>
        </div>
      </div>

    </div>
  );
};
