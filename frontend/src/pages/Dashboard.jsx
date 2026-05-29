// C:\Users\s9khr\sasasa\ecommerce-platform\frontend\src\pages\Dashboard.jsx

import React from "react";
import { useAuth } from "../hooks/useAuth";
import SellerDashboard from "../components/SellerDashboard";
import BuyerDashboard from "../components/BuyerDashboard";
import OwnerDashboard from "../components/OwnerDashboard"; // أضف هذا السطر

const Dashboard = () => {
  const { user } = useAuth();

  if (!user) {
    return (
      <div className="text-center p-8 text-red-600">
        خطأ: بيانات المستخدم مفقودة.
      </div>
    );
  }

  // توجيه المستخدم بناءً على الدور
  switch (user.role) {
    case "seller":
      return <SellerDashboard />;
    case "buyer":
      return <BuyerDashboard />;
    case "admin":
      return (
        <div className="p-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-4">
            لوحة تحكم المسؤول
          </h1>
          {/* هنا يمكنك وضع لوحة الأدمن العادي */}
          <p>مرحباً بالأدمن: {user.name}</p>
        </div>
      );
    case "owner":
      return <OwnerDashboard />; // أضف هذا
    default:
      return (
        <div className="text-center p-8 text-red-600">
          دور المستخدم غير مدعوم: {user.role}.
        </div>
      );
  }
};

export default Dashboard;
