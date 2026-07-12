import apiClient from './apiClient';

export const dashboardService = {
  getBuyerStats: async () => {
    const response = await apiClient.get('/api/dashboard/buyer/stats');
    return response.data;
  },

  getSellerStats: async () => {
    const response = await apiClient.get('/api/dashboard/seller/stats');
    return response.data;
  },

  getMatchRadar: async () => {
    const response = await apiClient.get('/api/dashboard/match-radar');
    return response.data;
  }
};
