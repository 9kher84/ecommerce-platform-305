// C:\Users\s9khr\sasasa\ecommerce-platform\frontend\src\pages\Dashboard.jsx

import React from 'react';
import { useAuth } from '../hooks/useAuth';
import SellerDashboard from '../components/SellerDashboard';
import BuyerDashboard from '../components/BuyerDashboard';

const Dashboard = () => {
    const { user } = useAuth();

    if (!user) {
        // هذا يفترض أنه لن يتم الوصول إلى هنا بفضل ProtectedRoute
        return <div className="text-center p-8 text-red-600">خطأ: بيانات المستخدم مفقودة.</div>;
    }

    // توجيه المستخدم بناءً على الدور
    switch (user.role) {
        case 'seller':
            return <SellerDashboard />;
        case 'buyer':
            return <BuyerDashboard />;
        case 'admin':
        case 'super_admin':
            // يمكن توجيههم إلى لوحة تحكم المسؤول (التي أنشأتها سابقاً)
            return (
                <div className="p-8 bg-white rounded-lg shadow-lg">
                    <h1 className="text-3xl font-bold text-gray-900 mb-4">لوحة تحكم المسؤول (ملخص)</h1>
                    <p className="text-gray-600">أنت مسجل كمسؤول. يرجى التوجه إلى <Link to="/admin/dashboard" className="text-primary-600 hover:underline font-semibold">صفحة الإدارة</Link> لإدارة النظام.</p>
                </div>
            );
        default:
            return <div className="text-center p-8 text-red-600">دور المستخدم غير مدعوم: {user.role}.</div>;
    }
};

export default Dashboard;