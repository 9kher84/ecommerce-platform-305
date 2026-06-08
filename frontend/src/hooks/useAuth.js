// hooks/useAuth.js - الإصلاح
import React, { createContext, useContext, useState, useEffect } from "react";
import apiService from "../services/apiService";

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);

  // التحقق من الجلسة عند تحميل التطبيق
  useEffect(() => {
    const checkAuth = async () => {
      try {
        // 🔥 استخدام الدالة مباشرة من apiService
        const user = apiService.getCurrentUser();

        if (user) {
          setUser(user);
          setIsAuthenticated(true);
        }
      } catch (error) {
        console.log("User not authenticated:", error.message);
        setUser(null);
        setIsAuthenticated(false);
      } finally {
        setLoading(false);
      }
    };

    checkAuth();
  }, []);

  // دالة تسجيل الدخول - الإصلاح
  // hooks/useAuth.js
  const handleLogin = async (email, password) => {
    try {
      // Clean input (Trim email only)
      const cleanEmail = email ? email.trim() : "";
      // DO NOT modify password (cases sensitive)

      const response = await apiService.login(cleanEmail, password);

      // Security Update: Token is now in HttpOnly Cookie, so we only check for user data
      if (response && response.user) {
        // تخزين بيانات المستخدم فقط
        localStorage.setItem("user", JSON.stringify(response.user));
        setUser(response.user);
        setIsAuthenticated(true);

        // تنظيف التوكن القديم إن وجد
        localStorage.removeItem("token");

        return response;
      }
    } catch (error) {
      console.error("Login failed:", error.message);
      throw error;
    }
  };

  // دالة تسجيل الخروج
  const handleLogout = async () => {
    try {
      await apiService.logout();
    } catch (error) {
      console.error("Logout error:", error);
    } finally {
      setUser(null);
      setIsAuthenticated(false);
    }
  };

  const updateUserData = (newUserData) => {
    setUser(newUserData);
    localStorage.setItem("user", JSON.stringify(newUserData));
  };

  const handleRegister = async (name, email, password, role, sectorIds) => {
    try {
      const response = await apiService.register(name, email, password, role, sectorIds);
      return response;
    } catch (error) {
      console.error("Registration failed:", error);
      throw error;
    }
  };

  const value = {
    user,
    isAuthenticated,
    loading,
    login: handleLogin,
    logout: handleLogout,
    register: handleRegister,
    updateUserData,
  };

  if (loading)
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-xl text-indigo-600">
          جاري التحقق من المصادقة...
        </div>
      </div>
    );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  return useContext(AuthContext);
};
