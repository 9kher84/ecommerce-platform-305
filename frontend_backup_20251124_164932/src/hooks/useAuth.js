import React, { createContext, useContext, useState, useEffect } from 'react';
import apiService from '../services/apiService';

// 1. إنشاء سياق المصادقة
const AuthContext = createContext(null);

// 2. مزود المصادقة (Auth Provider Component)
export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [loading, setLoading] = useState(true);

    // التحقق من الجلسة عند تحميل التطبيق (عبر الكوكيز)
    useEffect(() => {
        const checkAuth = async () => {
            try {
                const response = await apiService.getCurrentUser();
                if (response && response.user) {
                    setUser(response.user);
                    setIsAuthenticated(true);
                }
            } catch (error) {
                // فشل التحقق يعني أن المستخدم غير مسجل دخول (أو انتهت الجلسة)
                console.log("User not authenticated:", error.message);
                setUser(null);
                setIsAuthenticated(false);
            } finally {
                setLoading(false);
            }
        };

        checkAuth();
    }, []);

    // دالة تسجيل الدخول
    const handleLogin = async (email, password) => {
        try {
            const response = await apiService.login(email, password);
            if (response && response.user) {
                setUser(response.user);
                setIsAuthenticated(true);
                return true;
            }
        } catch (error) {
            console.error('Login failed:', error.message);
            throw error;
        }
    };

    // دالة إنشاء حساب
    const handleRegister = async (name, email, password, role) => {
        try {
            const response = await apiService.register(name, email, password, role);
            // بعد التسجيل، قد نحتاج لتسجيل الدخول تلقائياً أو توجيه المستخدم
            return response;
        } catch (error) {
            console.error('Registration failed:', error.message);
            throw error;
        }
    };

    // دالة تسجيل الخروج
    const handleLogout = async () => {
        try {
            await apiService.logout();
        } catch (error) {
            console.error('Logout error:', error);
        } finally {
            // مسح الحالة محلياً بغض النظر عن استجابة الخادم
            setUser(null);
            setIsAuthenticated(false);
        }
    };

    const updateUserData = (newUserData) => {
        setUser(newUserData);
    }

    const value = {
        user,
        isAuthenticated,
        loading,
        login: handleLogin,
        register: handleRegister,
        logout: handleLogout,
        updateUserData
    };

    if (loading) return <div className="flex items-center justify-center min-h-screen"><div className="text-xl text-indigo-600">جاري التحقق من المصادقة...</div></div>;

    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

// 3. الخطاف المخصص للوصول إلى سياق المصادقة
export const useAuth = () => {
    return useContext(AuthContext);
};