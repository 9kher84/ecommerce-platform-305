import React, { useState, useEffect } from 'react';
import { ownerService } from '../../services/ownerService';
import TraceViewer from './TraceViewer';

const RequestsTab = () => {
    const [requests, setRequests] = useState([]);
    const [loading, setLoading] = useState(true);
    const [states, setStates] = useState([]); // Dynamic states

    // Selection & Force
    const [selectedReq, setSelectedReq] = useState(null);
    const [forceState, setForceState] = useState('');
    const [forceReason, setForceReason] = useState('');
    const [forcePreviewTrace, setForcePreviewTrace] = useState(null); // The virtual trace for impact preview

    // View Trace (Why?)
    const [viewTraceData, setViewTraceData] = useState(null);
    const [viewingTrace, setViewingTrace] = useState(false);

    const fetchData = async () => {
        setLoading(true);
        try {
            const [reqRes, configRes] = await Promise.all([
                ownerService.getAllRequests(),
                ownerService.getConfig()
            ]);
            setRequests(reqRes.data);
            setStates(configRes.data.states);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    // Inspect: "Why is it in this state / Can User X update it?"
    const handleInspectPolicy = async (reqId, userId, userName) => {
        try {
            const data = {
                userId: userId, // The Actor being simulated
                resourceType: 'Request',
                resourceId: reqId,
                action: 'update'
            };
            const res = await ownerService.tracePolicy(data);
            // Label the simulation
            res.data.simulatedActorName = userName;
            setViewTraceData(res.data);
            setViewingTrace(true);
        } catch (err) {
            alert('Failed to inspect policy trace.');
        }
    };

    // Force Preview
    const handlePreviewForce = async () => {
        if (!selectedReq || !forceState) return;
        try {
            // We simulate the action of "transitioning" to the new state.
            // But 'trace' usually checks perms like 'update'.
            // To check specific state transition, we check 'update'.
            // The Impact Preview shows: "If User tried this, what happens?"
            // Usually DENY.
            // Then we say "Owner Force will Override this".

            const data = {
                userId: selectedReq.userId,
                resourceType: 'Request',
                resourceId: selectedReq.id,
                action: 'update' // Or 'publish', 'cancel' if specific actions map to states
            };

            // Map state to action for better preview context?
            if (forceState === 'cancelled') data.action = 'cancel';
            if (forceState === 'published') data.action = 'publish';

            const res = await ownerService.tracePolicy(data);
            setForcePreviewTrace(res.data);
        } catch (err) {
            alert('Preview Failed: ' + err.message);
        }
    };

    const handleConfirmForce = async () => {
        if (!selectedReq || !forceState || !forceReason) return;
        try {
            await ownerService.forceRequestTransition(selectedReq.id, forceState, forceReason);
            fetchData();
            setForceState('DONE'); // Trigger Success View
        } catch (err) {
            alert('Force Transition Failed: ' + (err.response?.data?.message || err.message));
        }
    };

    return (
        <div className="p-6 h-full flex flex-col">
            <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-bold text-white">Requests State Machine</h2>
                <button onClick={fetchData} className="text-sm text-indigo-400 hover:text-indigo-300">↻ Refresh</button>
            </div>

            {loading ? (
                <div className="text-neutral-500">Loading Sovereign View...</div>
            ) : (
                <div className="flex-1 overflow-auto bg-neutral-900 rounded-lg border border-neutral-800">
                    <table className="w-full text-left text-sm text-neutral-400">
                        <thead className="bg-neutral-800 text-neutral-300 uppercase font-bold text-xs">
                            <tr>
                                <th className="p-4">ID / Title</th>
                                <th className="p-4">User (Actor)</th>
                                <th className="p-4">State</th>
                                <th className="p-4 text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-neutral-800">
                            {requests.map(req => (
                                <tr key={req.id} className="hover:bg-neutral-800/50 transition-colors">
                                    <td className="p-4">
                                        <div className="font-mono text-xs text-neutral-500 mb-1">{req.id.slice(0, 8)}...</div>
                                        <div className="font-medium text-white">{req.title}</div>
                                    </td>
                                    <td className="p-4">
                                        {req.user?.name || 'Unknown'}
                                        <div className="text-xs text-neutral-600 font-mono">{req.userId}</div>
                                    </td>
                                    <td className="p-4">
                                        <span className={`px-2 py-1 rounded text-xs font-bold uppercase
                                            ${req.status === 'published' ? 'bg-green-900 text-green-300' :
                                                req.status === 'draft' ? 'bg-neutral-700 text-neutral-300' :
                                                    req.status === 'suspended' ? 'bg-red-900 text-red-300' :
                                                        'bg-blue-900 text-blue-300'}`
                                        }>
                                            {req.status}
                                        </span>
                                    </td>
                                    <td className="p-4 text-right space-x-2">
                                        <button
                                            onClick={() => handleInspectPolicy(req.id, req.userId, req.user?.name)}
                                            className="text-indigo-400 hover:text-indigo-300 text-xs px-2 py-1 rounded border border-indigo-500/30 bg-indigo-500/10"
                                        >
                                            🔍 Inspect
                                        </button>
                                        <button
                                            onClick={() => { setSelectedReq(req); setForceState(req.status); setForcePreviewTrace(null); }}
                                            className="bg-red-600/20 hover:bg-red-600/40 text-red-400 px-3 py-1 rounded border border-red-600/30 text-xs"
                                        >
                                            ⚡ Force
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}

            {/* Trace Viewer Modal (Inspect) */}
            {viewingTrace && viewTraceData && (
                <div className="fixed inset-0 z-[100]">
                    <TraceViewer
                        trace={viewTraceData}
                        onClose={() => { setViewingTrace(false); setViewTraceData(null); }}
                    />
                    <div className="absolute top-4 left-1/2 -translate-x-1/2 bg-indigo-600 px-4 py-1 rounded text-xs font-bold text-white shadow-xl z-[110]">
                        SIMULATING POLICY FOR ACTOR: {viewTraceData.simulatedActorName || 'USER'}
                    </div>
                </div>
            )}

            {/* Force Modal (Impact Preview) */}
            {selectedReq && (
                <div className="fixed inset-0 bg-black/90 flex items-center justify-center z-50 p-4">
                    <div className="bg-neutral-900 border border-red-900/50 rounded-xl w-full max-w-5xl shadow-2xl flex flex-col max-h-[90vh]">
                        <div className="p-6 border-b border-neutral-800 bg-neutral-950 rounded-t-xl">
                            <h3 className="text-xl font-bold text-white mb-1">Force Transition Override</h3>
                            <p className="text-xs text-neutral-500 font-mono">TARGET: {selectedReq.id} | CURRENT: {selectedReq.status}</p>
                        </div>

                        {forceState === 'DONE' ? (
                            <div className="flex-1 flex flex-col items-center justify-center p-12 text-center bg-black/50">
                                <div className="text-6xl mb-6">⚖️</div>
                                <h3 className="text-2xl font-bold text-white mb-2">Transition Enforced</h3>
                                <p className="text-neutral-400 max-w-md mb-8">
                                    The request state has been forced. This action is irreversible and has been logged in the Sovereign Audit Trail.
                                </p>
                                <button
                                    onClick={() => { setSelectedReq(null); setForceState(''); setForceReason(''); setForcePreviewTrace(null); }}
                                    className="px-8 py-3 bg-neutral-800 hover:bg-neutral-700 text-white rounded font-bold uppercase tracking-wider transition-all"
                                >
                                    Close Case
                                </button>
                            </div>
                        ) : (
                            <div className="flex-1 flex overflow-hidden">
                                {/* Controls */}
                                <div className="w-1/3 p-6 border-r border-neutral-800 space-y-6 bg-neutral-950">
                                    <div>
                                        <label className="block text-xs font-bold text-neutral-400 mb-2 uppercase">1. Target State</label>
                                        <select
                                            className="w-full bg-neutral-900 border border-neutral-700 rounded p-2 text-white text-sm focus:border-red-500 transition-colors"
                                            value={forceState}
                                            onChange={(e) => { setForceState(e.target.value); setForcePreviewTrace(null); }}
                                        >
                                            {states.map(s => (
                                                <option key={s} value={s}>{s.toUpperCase()}</option>
                                            ))}
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-xs font-bold text-neutral-400 mb-2 uppercase">2. Justification (Mandatory)</label>
                                        <textarea
                                            className="w-full bg-neutral-900 border border-neutral-700 rounded p-2 text-white text-sm h-32 focus:border-red-500 transition-colors resize-none"
                                            placeholder="Explain strict legal/technical reason for override..."
                                            value={forceReason}
                                            onChange={(e) => setForceReason(e.target.value)}
                                        />
                                    </div>

                                    <div className="pt-6 border-t border-neutral-800">
                                        <button
                                            onClick={handlePreviewForce}
                                            disabled={!forceState || forceState === selectedReq.status}
                                            className="w-full py-3 border border-dashed border-neutral-600 text-neutral-400 hover:text-white hover:border-white rounded mb-2 transition-all font-mono text-xs uppercase"
                                        >
                                            {forcePreviewTrace ? '↻ Re-Calculate Impact' : 'Step 3: Preview Impact'}
                                        </button>
                                    </div>
                                </div>

                                {/* Impact Virtual Trace */}
                                <div className="w-2/3 bg-black flex flex-col relative">
                                    {!forcePreviewTrace ? (
                                        <div className="flex-1 flex items-center justify-center text-neutral-600 italic p-10 text-center">
                                            Select Target State and Click "Preview Impact" to verify consequences before Forcing.
                                        </div>
                                    ) : (
                                        <div className="flex-1 flex flex-col overflow-hidden">
                                            {/* Decision Summary Layer */}
                                            <div className="bg-neutral-900 border-b border-neutral-800 p-6 space-y-2 shrink-0">
                                                <h4 className="text-sm font-bold text-white uppercase tracking-wider mb-2 border-l-2 border-red-500 pl-3">Executive Summary</h4>
                                                <ul className="text-xs space-y-1.5 text-neutral-300 list-disc pl-4">
                                                    <li>Standard Policy: <strong className="text-red-400">{forcePreviewTrace.decision || 'DENY'}</strong> (System would block this).</li>
                                                    <li>Forced Outcome: Request will immediately transition to <strong className="text-white">{forceState}</strong>.</li>
                                                    <li>Traceability: This manual intervention is being <strong className="text-white">cryptographically signed</strong> and logged.</li>
                                                </ul>
                                            </div>

                                            <div className="flex-1 relative overflow-auto p-4">
                                                <div className="absolute top-4 right-4 z-20 bg-red-600/90 text-white px-3 py-1 rounded font-bold text-xs uppercase shadow-lg animate-pulse">
                                                    Virtual Impact Preview
                                                </div>
                                                <TraceViewer trace={forcePreviewTrace} />
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}

                        {forceState !== 'DONE' && (
                            <div className="p-6 border-t border-neutral-800 bg-neutral-950 flex justify-between items-center rounded-b-xl">
                                <button
                                    onClick={() => setSelectedReq(null)}
                                    className="px-6 py-2 text-sm text-neutral-400 hover:text-white transition-colors"
                                >
                                    Cancel
                                </button>

                                <div className="flex items-center gap-4">
                                    {forcePreviewTrace && (
                                        <div className="text-xs text-red-400 font-mono">
                                            IMPACT ANALYZED: {forcePreviewTrace.decision}
                                        </div>
                                    )}
                                    <button
                                        onClick={handleConfirmForce}
                                        disabled={!forcePreviewTrace || !forceReason}
                                        className={`px-8 py-2 rounded font-bold text-sm tracking-wide shadow-lg transition-all
                                            ${(!forcePreviewTrace || !forceReason)
                                                ? 'bg-neutral-800 text-neutral-600 cursor-not-allowed'
                                                : 'bg-red-600 hover:bg-red-500 text-white hover:shadow-red-900/50'
                                            }`}
                                    >
                                        CONFIRM OVERRIDE
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};
export default RequestsTab;
