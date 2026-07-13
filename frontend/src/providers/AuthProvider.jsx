import React, { createContext, useContext, useEffect, useState } from 'react';
import { authService } from '../services/authService';
import { useQueryClient } from '@tanstack/react-query';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const queryClient = useQueryClient();

  useEffect(() => {
    const initAuth = async () => {
      const token = localStorage.getItem('token');
      if (!token) {
        setLoading(false);
        return;
      }

      try {
        // Try to fetch profile to validate token
        const response = await authService.getProfile();
        setUser(response.data); // backend wraps user in response.data
        setIsAuthenticated(true);
      } catch (error) {
        authService.logout();
        setIsAuthenticated(false);
        setUser(null);
      } finally {
        setLoading(false);
      }
    };

    initAuth();
  }, []);

  const logout = () => {
    authService.logout();
    setIsAuthenticated(false);
    setUser(null);
    queryClient.clear(); // Clear all react-query cache on logout
  };

  const login = (userData) => {
    setIsAuthenticated(true);
    setUser(userData);
  };

  // Keep internal state synced with react-query (if profile updates)
  // Or we can just rely on the context for basic auth state
  
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="text-primary font-medium">Loading session...</div>
      </div>
    );
  }

  return (
    <AuthContext.Provider value={{ isAuthenticated, user, logout, login }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
