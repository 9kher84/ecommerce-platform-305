import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { ownerService } from '../../services/ownerService';
import TraceViewer from './TraceViewer';

// Strict Role List (No Owner)
const ROLES = ['buyer', 'seller', 'admin'];

const UsersTab = () => {
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);

    // Modal State
    const [selectedUser, setSelectedUser] = useState(null);
    const [actionType, setActionType] = useState(null); // 'SUSPEND' | 'ACTIVATE' | 'ROLE'
    const [targetRole, setTargetRole] = useState('');
    const [reason, setReason] = useState('');
    const [previewTrace, setPreviewTrace] = useState(null);
    const [isSubmitting, setIsSubmitting] = useState(false);

    const { t, i18n } = useTranslation();

    const fetchUsers = async () => {
        setLoading(true);
        try {
            const res = await ownerService.getAllUsers();
            setUsers(res.data);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchUsers();
    }, []);

    // ... (modal handlers remain same)
    const openModal = (user, type) => {
        setSelectedUser(user);
        setActionType(type);
        setReason('');
        setPreviewTrace(null);
        setTargetRole(user.role);
    };

    const closeModal = () => {
        setSelectedUser(null);
        setActionType(null);
        setReason('');
        setPreviewTrace(null);
        setIsSubmitting(false);
    };

    const handlePreview = async () => {
        if (!selectedUser || !actionType || !reason) return;
        try {
            const data = {
                userId: selectedUser.id,
                resourceType: 'User',
                resourceId: selectedUser.id,
                action: actionType.toLowerCase(),
                targetRole: actionType === 'ROLE' ? targetRole : undefined
            };
            const res = await ownerService.tracePolicy(data);
            setPreviewTrace(res.data);
        } catch (err) {
            alert('Trace Failed: ' + err.message);
        }
    };

    const handleConfirm = async () => {
        if (!selectedUser) return;
        setIsSubmitting(true);
        try {
            if (actionType === 'SUSPEND') {
                await ownerService.overrideSuspendUser(selectedUser.id, reason);
            } else if (actionType === 'ACTIVATE') {
                await ownerService.overrideActivateUser(selectedUser.id, reason);
            } else if (actionType === 'ROLE') {
                await ownerService.overrideRoleChange(selectedUser.id, targetRole, reason);
            }
            fetchUsers();
            setIsSubmitting('DONE');
        } catch (err) {
            alert('Action Failed: ' + (err.response?.data?.message || err.message));
            setIsSubmitting(false);
        }
    };

    return (
        <div className="p-6 h-full flex flex-col">
            <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-bold text-white">{t('dashboard.users')}</h2>
                <button onClick={fetchUsers} className="text-sm text-indigo-400 hover:text-indigo-300">↻ {t('users.refresh')}</button>
            </div>

            {loading ? (
                <div className="text-neutral-500 animate-pulse">{t('common.loading')}</div>
            ) : (
                <div className="flex-1 overflow-auto bg-neutral-900 rounded-lg border border-neutral-800">
                    <table className="w-full text-left text-sm text-neutral-400">
                        <thead className="bg-neutral-800 text-neutral-300 uppercase font-bold text-xs sticky top-0">
                            <tr>
                                <th className="p-4">{t('users.id')}</th>
                                <th className="p-4">{t('users.identity')}</th>
                                <th className="p-4">{t('users.role')}</th>
                                <th className="p-4">{t('users.status')}</th>
                                <th className="p-4 text-right">{t('users.actions')}</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-neutral-800">
                            {users.map(u => (
                                <tr key={u.id} className="hover:bg-neutral-800/50 transition-colors">
                                    <td className="p-4 font-mono text-xs text-neutral-600">{u.id}</td>
                                    <td className="p-4">
                                        <div className="font-bold text-white">{u.name}</div>
                                        <div className="text-xs text-neutral-500">{u.email}</div>
                                    </td>
                                    <td className="p-4">
                                        <span className="px-2 py-1 rounded bg-neutral-800 text-neutral-300 text-xs border border-neutral-700 font-mono">
                                            {u.role.toUpperCase()}
                                        </span>
                                    </td>
                                    <td className="p-4">
                                        {u.isActive ? (
                                            <span className="text-green-500 text-xs font-bold px-2 py-1 bg-green-900/20 rounded">{t('status.active')}</span>
                                        ) : (
                                            <span className="text-red-500 text-xs font-bold px-2 py-1 bg-red-900/20 rounded">{t('status.suspended')}</span>
                                        )}
                                    </td>
                                    <td className="p-4 text-right space-x-2">
                                        <button
                                            onClick={() => openModal(u, 'ROLE')}
                                            className="px-2 py-1 text-xs border border-neutral-600 rounded text-neutral-400 hover:text-white transition-colors"
                                        >
                                            {t('users.change_role')}
                                        </button>

                                        {u.isActive ? (
                                            <button
                                                onClick={() => openModal(u, 'SUSPEND')}
                                                className="px-2 py-1 text-xs border border-red-800 bg-red-900/20 text-red-500 rounded hover:bg-red-900/40 transition-colors"
                                            >
                                                {t('users.suspend')}
                                            </button>
                                        ) : (
                                            <button
                                                onClick={() => openModal(u, 'ACTIVATE')}
                                                className="px-2 py-1 text-xs border border-green-800 bg-green-900/20 text-green-500 rounded hover:bg-green-900/40 transition-colors"
                                            >
                                                {t('users.activate')}
                                            </button>
                                        )}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}

            {/* Sovereign Action Modal */}
            {selectedUser && (
                <div className="fixed inset-0 bg-black/90 flex items-center justify-center z-50 p-4">
                    <div className="bg-neutral-900 border border-red-900/50 rounded-xl w-full max-w-5xl shadow-2xl flex flex-col max-h-[90vh]">
                        {/* Header */}
                        <div className="p-6 border-b border-neutral-800 flex justify-between items-center bg-neutral-950 rounded-t-xl">
                            <div>
                                <h3 className="text-xl font-bold text-white mb-1">
                                    {actionType === 'SUSPEND' && 'Suspend User Override'}
                                    {actionType === 'ACTIVATE' && 'Activate User Override'}
                                    {actionType === 'ROLE' && 'Role Change Override'}
                                </h3>
                                <p className="text-xs text-neutral-500 font-mono">TARGET: {selectedUser.id} ({selectedUser.email})</p>
                            </div>
                            <div className="bg-red-900/20 border border-red-900 text-red-400 px-3 py-1 rounded text-xs font-bold uppercase animate-pulse">
                                Sovereign Intervention
                            </div>
                        </div>

                        {/* Body - Switch between Success & Form */}
                        {isSubmitting === 'DONE' ? (
                            <div className="flex-1 flex flex-col items-center justify-center p-12 text-center bg-black/50">
                                <div className="text-6xl mb-6">⚖️</div>
                                <h3 className="text-2xl font-bold text-white mb-2">Decision Recorded</h3>
                                <p className="text-neutral-400 max-w-md mb-8">
                                    This decision is now part of the system’s permanent record.
                                    The cryptographic audit trail has been sealed.
                                </p>
                                <button
                                    onClick={closeModal}
                                    className="px-8 py-3 bg-neutral-800 hover:bg-neutral-700 text-white rounded font-bold uppercase tracking-wider transition-all"
                                >
                                    Close Case
                                </button>
                            </div>
                        ) : (
                            <div className="flex-1 flex overflow-hidden">
                                {/* Controls */}
                                <div className="w-1/3 p-6 border-r border-neutral-800 space-y-6 bg-neutral-950 overflow-auto">
                                    <div className="p-4 bg-neutral-900 rounded border border-neutral-800 text-xs text-neutral-400">
                                        This action overrides standard system policy. You must provide a valid reason and verify the impact before confirming.
                                    </div>

                                    {actionType === 'ROLE' && (
                                        <div>
                                            <label className="block text-xs font-bold text-neutral-400 mb-2 uppercase">New Role</label>
                                            <select
                                                className="w-full bg-neutral-900 border border-neutral-700 rounded p-2 text-white text-sm"
                                                value={targetRole}
                                                onChange={(e) => { setTargetRole(e.target.value); setPreviewTrace(null); }}
                                            >
                                                {ROLES.map(r => (
                                                    <option key={r} value={r}>{r.toUpperCase()}</option>
                                                ))}
                                            </select>
                                        </div>
                                    )}

                                    <div>
                                        <label className="block text-xs font-bold text-neutral-400 mb-2 uppercase">Justification (Legal/Technical)</label>
                                        <textarea
                                            className="w-full bg-neutral-900 border border-neutral-700 rounded p-2 text-white text-sm h-32 focus:border-red-500 transition-colors resize-none"
                                            placeholder="Explain strict legal or technical reason for this override..."
                                            value={reason}
                                            onChange={(e) => setReason(e.target.value)}
                                        />
                                        <div className="text-right text-[10px] text-neutral-600 mt-1">{reason.length} / 15 characters</div>
                                    </div>

                                    <button
                                        onClick={handlePreview}
                                        disabled={reason.length < 15 || (actionType === 'ROLE' && targetRole === selectedUser.role)}
                                        className="w-full py-3 border border-dashed border-neutral-600 text-neutral-400 hover:text-white hover:border-white rounded mb-2 transition-all font-mono text-xs uppercase"
                                    >
                                        {previewTrace ? '↻ Re-Verify Impact' : 'Step 1: Verify Policy Impact'}
                                    </button>
                                </div>

                                {/* Impact Trace + Summary */}
                                <div className="w-2/3 bg-black flex flex-col relative">
                                    {!previewTrace ? (
                                        <div className="flex-1 flex items-center justify-center text-neutral-600 italic p-10 text-center">
                                            Enter justification and click Verify Impact to load the Policy Trace.
                                        </div>
                                    ) : (
                                        <div className="flex-1 flex flex-col overflow-hidden">
                                            {/* Decision Summary Layer */}
                                            <div className="bg-neutral-900 border-b border-neutral-800 p-6 space-y-2 shrink-0">
                                                <h4 className="text-sm font-bold text-white uppercase tracking-wider mb-2 border-l-2 border-red-500 pl-3">Executive Summary</h4>
                                                <ul className="text-xs space-y-1.5 text-neutral-300 list-disc pl-4">
                                                    <li>System Logic Result: <strong className="text-red-400">{previewTrace.decision || 'DENY'}</strong> (Standard Rules).</li>
                                                    <li>Intervention: You are explicitly <strong className="text-white">forcing</strong> a state change to <strong className="text-white">{actionType}</strong>.</li>
                                                    <li>Documentation: Your ID, Reason, and this Trace will be <strong className="text-white">permanently logged</strong> in the immutable Audit Trail.</li>
                                                </ul>
                                            </div>

                                            {/* Scrollable Trace */}
                                            <div className="flex-1 relative overflow-auto pt-4 p-4">
                                                <div className="absolute top-0 right-4 bg-neutral-800 text-[10px] text-neutral-500 px-2 py-1 rounded-b">EVIDENCE PREVIEW</div>
                                                <TraceViewer trace={previewTrace} />
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}

                        {/* Footer (Hidden if Success) */}
                        {isSubmitting !== 'DONE' && (
                            <div className="p-6 border-t border-neutral-800 bg-neutral-950 flex justify-between items-center rounded-b-xl">
                                <button
                                    onClick={closeModal}
                                    disabled={isSubmitting}
                                    className="px-6 py-2 text-sm text-neutral-400 hover:text-white transition-colors"
                                >
                                    Cancel
                                </button>

                                <button
                                    onClick={handleConfirm}
                                    disabled={!previewTrace || isSubmitting}
                                    className={`px-8 py-2 rounded font-bold text-sm tracking-wide shadow-lg transition-all
                                        ${(!previewTrace || isSubmitting)
                                            ? 'bg-neutral-800 text-neutral-600 cursor-not-allowed'
                                            : 'bg-red-600 hover:bg-red-500 text-white hover:shadow-red-900/50'
                                        }`}
                                >
                                    {isSubmitting ? 'EXECUTING...' : 'CONFIRM SOVEREIGN OVERRIDE'}
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};

export default UsersTab;
