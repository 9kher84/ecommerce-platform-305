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
  },

  // Purchase Order Operations
  generatePO: async (awardId) => {
    const response = await apiClient.post('/api/v2/purchase-orders/generate', { awardId });
    return response.data;
  },

  getSellerPOs: async () => {
    const response = await apiClient.get('/api/v2/purchase-orders/seller');
    return response.data;
  },

  acceptPO: async (poId) => {
    const response = await apiClient.post(`/api/v2/purchase-orders/${poId}/accept`);
    return response.data;
  },

  rejectPO: async (poId, reason) => {
    const response = await apiClient.post(`/api/v2/purchase-orders/${poId}/reject`, { reason });
    return response.data;
  },

  // Fulfillment Operations
  startPreparation: async (poId) => {
    const response = await apiClient.post('/api/v2/shipments/preparation', { poId });
    return response.data;
  },

  markReadyToShip: async (poId) => {
    const response = await apiClient.post(`/api/v2/shipments/preparation/${poId}/ready`);
    return response.data;
  },

  createShipment: async (payload) => {
    const response = await apiClient.post('/api/v2/shipments', payload);
    return response.data;
  },

  dispatchShipment: async (shipmentId) => {
    const response = await apiClient.post(`/api/v2/shipments/${shipmentId}/dispatch`);
    return response.data;
  },

  getFulfillmentSummary: async (poId) => {
    const response = await apiClient.get(`/api/v2/shipments/po/${poId}/summary`);
    return response.data;
  }
};
