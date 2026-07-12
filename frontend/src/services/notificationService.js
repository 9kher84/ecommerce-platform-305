import apiClient from './apiClient';

export const notificationService = {
  getNotifications: async (params) => {
    // params: page, limit, unreadOnly
    const response = await apiClient.get('/api/notifications', { params });
    return response.data; // { success, count, totalPages, currentPage, data }
  },

  getUnreadCount: async () => {
    const response = await apiClient.get('/api/notifications/unread-count');
    return response.data; // { success, count }
  },

  markAllAsRead: async () => {
    const response = await apiClient.patch('/api/notifications/read-all');
    return response.data;
  },

  markAsRead: async (id) => {
    const response = await apiClient.patch(`/api/notifications/${id}/read`);
    return response.data;
  }
};
