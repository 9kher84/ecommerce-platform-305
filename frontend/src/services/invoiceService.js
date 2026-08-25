import apiClient from './apiClient';

export const invoiceService = {
  getMyInvoices: async () => {
    const response = await apiClient.get('/api/invoice/my');
    return response.data;
  },

  getInvoiceById: async (id) => {
    const response = await apiClient.get(`/api/invoice/${id}`);
    return response.data;
  },
};
