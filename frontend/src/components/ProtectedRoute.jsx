// C:\Users\s9khr\sasasa\ecommerce-platform\frontend\src\components\ProtectedRoute.jsx

import React from "react";
import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";

const ProtectedRoute = ({ children, allowedRoles }) => {
  const { user, isAuthenticated, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    // يمكن إضافة شاشة تحميل أفضل هنا
    return <div className="text-center p-20">جاري التحقق من الصلاحيات...</div>;
  }

  if (!isAuthenticated) {
    // إذا لم يكن مصادقاً، أعد توجيهه لصفحة الدخول مع حفظ المسار الحالي
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // التحقق من الدور (إذا تم تحديد أدوار مسموحة)
  if (allowedRoles && !allowedRoles.includes(user.role)) {
    // إذا لم يكن الدور مسموحاً به
    alert("غير مصرح لك بالوصول إلى هذه الصفحة.");
    return <Navigate to="/" replace />;
  }

  // إذا كان مصادقاً ولديه الدور الصحيح، اعرض المكون المطلوب
  return children;
};

export default ProtectedRoute;
