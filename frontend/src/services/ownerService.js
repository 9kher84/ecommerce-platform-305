import axios from 'axios';

// 👑 Sovereign Service
// Independent from standard apiService.js
// Enforces 'include credentials' for Cookie Auth
const ownerClient = axios.create({
    baseURL: '/api/owner',
    withCredentials: true,
    headers: {
        'Content-Type': 'application/json'
    }
});

ownerClient.interceptors.response.use(
    response => response,
    error => {
        if (error.response && error.response.status === 401) {
            // Unauthenticated - Redirect to Bootstrap
            window.location.href = '/owner/login';
        }
        return Promise.reject(error);
    }
);

export const ownerService = {
    // Identity
    // Users
    getAllUsers: () => ownerClient.get('/users'),
    getConfig: () => ownerClient.get('/config'),
    createUser: (data) => ownerClient.post('/users', data),
    overrideSuspendUser: (userId, reason) => ownerClient.post('/override/suspend-user', { userId, reason }),
    overrideActivateUser: (userId, reason) => ownerClient.post('/override/activate-user', { userId, reason }),
    overrideRoleChange: (userId, newRole, reason) => ownerClient.post('/override/role-change', { userId, newRole, reason }),

    // Requests (Sovereign)
    getAllRequests: (params) => ownerClient.get('/requests', { params }),
    forceRequestTransition: (id, to, reason) => ownerClient.post(`/requests/${id}/force-transition`, { to, reason }),

    // Quotes
    getAllQuotes: () => ownerClient.get('/quotes'),

    // Policy Trace
    tracePolicy: (payload) => ownerClient.post('/policy/trace', payload),

    // Audit
    getAuditLogs: (params) => ownerClient.get('/audit-logs', { params }),
    exportAuditLog: (id) => ownerClient.get(`/audit-logs/${id}/export`, { responseType: 'blob' }),

    // Delegations
    getDelegations: () => ownerClient.get('/delegations'),

    // Overrides

};
