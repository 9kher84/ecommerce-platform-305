import apiClient from './apiClient';

export const quoteService = {
  submitQuote: async (data) => {
    // data: { requestId, price, deliveryDate, ... }
    const response = await apiClient.post('/api/quotes', data);
    return response.data; // { success, message, quote }
  },

  getMyQuotes: async (status) => {
    const response = await apiClient.get('/api/quotes/my-quotes', { params: { status } });
    return response.data; // { success, count, quotes }
  },

  getQuotesForRequest: async (requestId) => {
    const response = await apiClient.get(`/api/quotes/request/${requestId}`);
    return response.data; // { success, count, quotes }
  },

  negotiateQuote: async (id, data) => {
    // data: { price, date }
    const response = await apiClient.post(`/api/quotes/${id}/negotiate`, data);
    return response.data; // { success, message, quote }
  },

  respondToNegotiation: async (id, data) => {
    // data: { action: 'accept' | 'reject' | 'counter', price, date }
    const response = await apiClient.post(`/api/quotes/${id}/respond`, data);
    return response.data;
  },

  acceptQuote: async (id) => {
    const response = await apiClient.post(`/api/quotes/${id}/accept`);
    return response.data;
  },

  rejectQuote: async (id) => {
    const response = await apiClient.post(`/api/quotes/${id}/reject`);
    return response.data;
  },

  withdrawQuote: async (id) => {
    const response = await apiClient.post(`/api/quotes/${id}/withdraw`);
    return response.data;
  }
};
