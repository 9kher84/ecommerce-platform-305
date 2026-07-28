import apiClient from './apiClient';

export const commercialService = {
  // Inbox / Checkout
  getInbox: async () => {
    const response = await apiClient.get('/api/v2/negotiations/inbox');
    return response.data;
  },
  
  checkoutAwards: async (processIds) => {
    const response = await apiClient.post('/api/v2/negotiations/awards/checkout', { processIds });
    return response.data;
  },

  // Matrix & Comparison
  getMatrix: async (workPackageId) => {
    const response = await apiClient.get(`/api/v2/negotiations/work-packages/${workPackageId}/matrix`);
    return response.data;
  },

  // Timeline & Execution
  getTimeline: async (processId) => {
    const response = await apiClient.get(`/api/v2/negotiations/${processId}/timeline`);
    return response.data;
  },

  submitInitialProposal: async (workPackageId, payload) => {
    const response = await apiClient.post(`/api/v2/negotiations/work-packages/${workPackageId}/proposals`, payload);
    return response.data;
  },

  submitRevision: async (processId, payload) => {
    const response = await apiClient.post(`/api/v2/negotiations/${processId}/revisions`, payload);
    return response.data;
  },

  acceptRevision: async (processId) => {
    const response = await apiClient.post(`/api/v2/negotiations/${processId}/accept`);
    return response.data;
  },

  rejectRevision: async (processId) => {
    const response = await apiClient.post(`/api/v2/negotiations/${processId}/reject`);
    return response.data;
  }
};
