import apiClient from './apiClient';

export const adminService = {
  getAdminStats: async () => {
    const response = await apiClient.get('/api/dashboard/admin/stats');
    return response.data;
  },

  getAllUsers: async (params = {}) => {
    // params can include: page, limit, search, role, isActive
    const response = await apiClient.get('/api/admin/users/all', { params });
    return response.data;
  },

  toggleUserStatus: async (userId, isActive) => {
    // The endpoint toggle-status expects { isActive } in body
    const response = await apiClient.post(`/api/admin/users/${userId}/toggle-status`, { isActive });
    return response.data;
  }
};
