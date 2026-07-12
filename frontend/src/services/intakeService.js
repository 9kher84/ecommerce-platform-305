import apiClient from './apiClient';

export const intakeService = {
  analyzeIntake: async (data) => {
    const response = await apiClient.post('/api/intake/analyze', data);
    return response.data;
  },

  createOpportunity: async (data) => {
    const response = await apiClient.post('/api/intake/create', data);
    return response.data;
  }
};
