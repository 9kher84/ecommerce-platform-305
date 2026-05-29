// C:\Users\s9khr\sasasa\ecommerce-platform\frontend\src\components\Header.jsx

import React from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
import { User, LogOut } from "lucide-react";

const Header = () => {
  const { isAuthenticated, user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  return (
    <header className="bg-white shadow-md sticky top-0 z-30" dir="rtl">
      <div className="container mx-auto px-4 py-3 flex justify-between items-center">
        {/* الشعار */}
        <Link to="/" className="text-2xl font-extrabold text-primary-600">
          منصة المزايدة
        </Link>

        {/* روابط التنقل الرئيسية */}
        <nav className="hidden md:flex space-x-6 space-x-reverse text-gray-700 font-medium">
          <Link to="/" className="hover:text-primary-600 transition-colors">
            الرئيسية
          </Link>
          <Link
            to="/posts"
            className="hover:text-primary-600 transition-colors"
          >
            تصفح المزايدات
          </Link>
          {isAuthenticated && (
            <Link
              to="/dashboard"
              className="hover:text-primary-600 transition-colors"
            >
              لوحة التحكم
            </Link>
          )}
          {isAuthenticated && user.role === "admin" && (
            <Link
              to="/admin/dashboard"
              className="text-red-600 hover:text-red-800 transition-colors font-bold"
            >
              إدارة
            </Link>
          )}
        </nav>

        {/* أزرار المصادقة/الحساب */}
        <div className="flex items-center space-x-3 space-x-reverse">
          {isAuthenticated ? (
            <>
              <span className="text-sm font-semibold text-gray-800 hidden sm:block">
                مرحباً، {user.name} ({user.role === "seller" ? "بائع" : "مشتري"}
                )
              </span>
              <button
                onClick={handleLogout}
                className="p-2 text-white bg-red-500 rounded-full hover:bg-red-600 transition-colors flex items-center"
                title="تسجيل الخروج"
              >
                <LogOut className="w-5 h-5" />
              </button>
            </>
          ) : (
            <>
              <Link
                to="/login"
                className="bg-primary-600 text-white px-4 py-2 rounded-lg hover:bg-primary-700 transition-colors"
              >
                دخول
              </Link>
              <Link
                to="/signup"
                className="hidden sm:block text-primary-600 border border-primary-600 px-4 py-2 rounded-lg hover:bg-primary-50 transition-colors"
              >
                تسجيل جديد
              </Link>
            </>
          )}
        </div>
      </div>
    </header>
  );
};

export default Header;
