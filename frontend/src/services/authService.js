import apiClient from './apiClient';

export const authService = {
  /**
   * Login a user
   * @param {Object} credentials { email, password }
   * @returns {Promise<Object>} { success, token, refreshToken, user }
   */
  login: async (credentials) => {
    const response = await apiClient.post('/api/auth/login', credentials);
    return response.data;
  },

  /**
   * Register a new user
   * @param {Object} userData { name, email, password, role, sectorIds, subscriptionTier, referrer_code }
   * @returns {Promise<Object>} { success, token, refreshToken, user }
   */
  register: async (userData) => {
    const response = await apiClient.post('/api/users/register', userData);
    return response.data;
  },

  /**
   * Get current user profile
   * @returns {Promise<Object>} { success, data: User }
   */
  getProfile: async () => {
    const response = await apiClient.get('/api/auth/me');
    return response.data;
  },

  /**
   * Update user profile
   * @param {Object} profileData 
   * @returns {Promise<Object>} { success, message }
   */
  updateProfile: async (profileData) => {
    const response = await apiClient.put('/api/users/profile', profileData);
    return response.data;
  },

  /**
   * Logout user (local clearing only, backend handles stateless JWT via expiration)
   */
  logout: () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
  }
};
