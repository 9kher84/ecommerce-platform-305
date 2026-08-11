import apiClient from './apiClient';

export const entityService = {
  getRequests: async (params) => {
    const response = await apiClient.get('/api/requests', { params });
    return response.data; 
  },

  getMyRequests: async (params) => {
    const response = await apiClient.get('/api/requests/my-requests', { params });
    return response.data;
  },

  getRequestDetails: async (id) => {
    const response = await apiClient.get(`/api/requests/${id}`);
    return response.data;
  },

  createRequest: async (data) => {
    const response = await apiClient.post('/api/requests', data);
    return response.data;
  },

  updateRequestStatus: async (id, status) => {
    const response = await apiClient.put(`/api/requests/${id}/status`, { status });
    return response.data;
  },

  updateRequest: async (id, data) => {
    const response = await apiClient.put(`/api/requests/${id}`, data);
    return response.data;
  },

  getCategories: async () => {
    const response = await apiClient.get('/api/categories');
    return response.data;
  },

  getProducts: async () => {
    // Note: Backend /api/products is a Seller-only route that returns { success, count, products }
    // It does not support pagination, search, or filters natively via query params in the current controller.
    const response = await apiClient.get('/api/products');
    return response.data; 
  },

  publishRequest: async (id) => {
    const response = await apiClient.post(`/api/requests/${id}/publish`);
    return response.data;
  },
  
  deleteDraft: async (id) => {
    const response = await apiClient.delete(`/api/requests/${id}/draft`);
    return response.data;
  }
};
