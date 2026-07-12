import apiClient from './apiClient';

export const dealService = {
  getDeals: async (status) => {
    const response = await apiClient.get('/api/deals', { params: { status } });
    return response.data; // { success, count, deals }
  },

  getDealById: async (id) => {
    const response = await apiClient.get(`/api/deals/${id}`);
    return response.data; // { success, deal }
  },

  updateDealStatus: async (id, data) => {
    // data: { status, notes }
    const response = await apiClient.patch(`/api/deals/${id}/status`, data);
    return response.data;
  }
};
