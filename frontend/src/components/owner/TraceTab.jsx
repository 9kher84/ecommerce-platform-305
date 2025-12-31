import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { ownerService } from '../../services/ownerService';
import TraceViewer from './TraceViewer';

const TraceTab = () => {
    const [users, setUsers] = useState([]);
    const [loadingUsers, setLoadingUsers] = useState(false);

    // Form State
    const [selectedUser, setSelectedUser] = useState('');
    const [resourceType, setResourceType] = useState('Request');
    const [resourceId, setResourceId] = useState('');
    const [action, setAction] = useState('view');

    // Result State
    const [traceResult, setTraceResult] = useState(null);
    const [traceLoading, setTraceLoading] = useState(false);

    const { t } = useTranslation();

    useEffect(() => {
        const fetchUsers = async () => {
            setLoadingUsers(true);
            try {
                // Fetch ALL users for Policy Lab
                const res = await ownerService.getAllUsers();
                setUsers(res.data);
                if (res.data.length > 0) setSelectedUser(res.data[0].id);
            } catch (err) {
                console.error('Failed to users', err);
            } finally {
                setLoadingUsers(false);
            }
        };
        fetchUsers();
    }, []);

    // ... (handlers remain)

    const handleTrace = async () => {
        if (!selectedUser) return;
        setTraceLoading(true);
        setTraceResult(null);
        try {
            const res = await ownerService.tracePolicy({
                userId: selectedUser,
                resourceType,
                resourceId: resourceId || undefined,
                action
            });
            setTraceResult(res.data);
        } catch (err) {
            alert('Trace Failed: ' + (err.response?.data?.message || err.message));
        } finally {
            setTraceLoading(false);
        }
    };

    const handleExport = async () => {
        if (!traceResult) return;
        try {
            await ownerService.exportTracePolicy({
                userId: selectedUser,
                resourceType,
                resourceId: resourceId || undefined,
                action
            });
        } catch (err) {
            alert('Export Failed');
        }
    };

    return (
        <div className="p-6 h-full flex flex-col gap-6">
            <h2 className="text-xl font-bold text-white">{t('policies.title')}</h2>

            <div className="bg-neutral-900 border border-neutral-800 p-6 rounded-lg grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                    <h3 className="text-sm font-bold text-neutral-400 uppercase tracking-wider">{t('policies.context')}</h3>

                    <div>
                        <label className="block text-xs text-neutral-500 mb-1">{t('policies.actor')}</label>
                        <select
                            className="w-full bg-neutral-950 border border-neutral-700 rounded p-2 text-white text-sm"
                            value={selectedUser}
                            onChange={(e) => setSelectedUser(e.target.value)}
                            disabled={loadingUsers}
                        >
                            {loadingUsers ? <option>{t('common.loading')}</option> : users.map(u => (
                                <option key={u.id} value={u.id}>{u.name} ({u.role})</option>
                            ))}
                        </select>
                    </div>
                </div>

                <div className="space-y-4">
                    <h3 className="text-sm font-bold text-neutral-400 uppercase tracking-wider">{t('policies.target')}</h3>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-xs text-neutral-500 mb-1">{t('policies.resource_type')}</label>
                            <select
                                className="w-full bg-neutral-950 border border-neutral-700 rounded p-2 text-white text-sm"
                                value={resourceType}
                                onChange={(e) => setResourceType(e.target.value)}
                            >
                                <option value="Request">Request</option>
                                <option value="Quote">Quote</option>
                                <option value="Product">Product</option>
                                <option value="User">User</option>
                            </select>
                        </div>
                        <div>
                            <label className="block text-xs text-neutral-500 mb-1">{t('policies.action')}</label>
                            <select
                                className="w-full bg-neutral-950 border border-neutral-700 rounded p-2 text-white text-sm"
                                value={action}
                                onChange={(e) => setAction(e.target.value)}
                            >
                                <option value="view">View</option>
                                <option value="create">Create</option>
                                <option value="update">Update</option>
                                <option value="delete">Delete</option>
                                <option value="publish">Publish</option>
                                <option value="cancel">Cancel</option>
                                <option value="submitQuote">Submit Quote</option>
                                <option value="approve">Approve</option>
                                <option value="reject">Reject</option>
                            </select>
                        </div>
                    </div>

                    <div>
                        <label className="block text-xs text-neutral-500 mb-1">{t('policies.resource_id')}</label>
                        <input
                            type="text"
                            className="w-full bg-neutral-950 border border-neutral-700 rounded p-2 text-white text-sm font-mono"
                            placeholder="e.g. 550e8400-e29b-..."
                            value={resourceId}
                            onChange={(e) => setResourceId(e.target.value)}
                        />
                    </div>
                </div>

                <div className="md:col-span-2 flex justify-end gap-4">
                    {traceResult && (
                        <button
                            onClick={handleExport}
                            className="text-indigo-400 hover:text-indigo-300 font-bold py-2 px-6 text-sm border border-indigo-500/30 rounded"
                        >
                            ⬇ {t('policies.download')}
                        </button>
                    )}
                    <button
                        onClick={handleTrace}
                        disabled={traceLoading}
                        className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2 px-6 rounded transition-colors"
                    >
                        {traceLoading ? t('common.loading') : `🔍 ${t('policies.run')}`}
                    </button>
                </div>
            </div>

            {/* Trace Result Viewer */}
            {traceResult && (
                <div className="flex-1 overflow-hidden relative border border-neutral-800 rounded-xl">
                    <TraceViewer trace={traceResult} onClose={() => setTraceResult(null)} />
                </div>
            )}

            {!traceResult && (
                <div className="flex-1 flex items-center justify-center text-neutral-600 italic">
                    {t('policies.waiting')}
                </div>
            )}
        </div>
    );
};

export default TraceTab;
