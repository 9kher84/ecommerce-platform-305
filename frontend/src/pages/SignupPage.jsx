// C:\Users\s9khr\sasasa\ecommerce-platform\frontend\src\pages\SignupPage.jsx

import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";

const SignupPage = () => {
  // 1. حالة النموذج (Form State)
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  // الافتراضي هو 'buyer' لأن معظم المستخدمين يسجلون كمشترين
  const [role, setRole] = useState("buyer");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  // 2. استخدام خطاف المصادقة والتوجيه
  const { register } = useAuth();
  const navigate = useNavigate();

  // 3. معالج إرسال النموذج (Form Submission)
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      // استدعاء دالة التسجيل من خطاف useAuth مع تمرير الدور
      await register(name, email, password, role);

      // في حالة النجاح، التوجيه إلى صفحة الدخول أو لوحة التحكم مباشرة
      alert("✅ تم التسجيل بنجاح! يمكنك الآن تسجيل الدخول.");
      navigate("/login");
    } catch (err) {
      // عرض رسالة الخطأ
      const errorMessage =
        err.response?.data?.message || "فشل التسجيل. يرجى مراجعة البيانات.";
      setError(errorMessage);
      console.error("Registration Error:", err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex justify-center items-center min-h-screen bg-gray-100 p-4">
      <div className="w-full max-w-md bg-white p-8 rounded-lg shadow-xl">
        <h2 className="text-3xl font-bold text-gray-900 mb-6 text-center">
          إنشاء حساب جديد
        </h2>

        {/* رسالة الخطأ */}
        {error && (
          <div
            className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mb-4"
            role="alert"
          >
            <span className="block sm:inline">{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label
              htmlFor="name"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              الاسم الكامل
            </label>
            <input
              id="name"
              name="name"
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-primary-500 focus:border-primary-500"
              placeholder="اسمك الكامل"
            />
          </div>

          <div>
            <label
              htmlFor="email"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              البريد الإلكتروني
            </label>
            <input
              id="email"
              name="email"
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-primary-500 focus:border-primary-500"
              placeholder="example@domain.com"
            />
          </div>

          <div>
            <label
              htmlFor="password"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              كلمة المرور
            </label>
            <input
              id="password"
              name="password"
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-primary-500 focus:border-primary-500"
            />
          </div>

          {/* حقل اختيار الدور (Role Selection) */}
          <div>
            <label
              htmlFor="role"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              الدور
            </label>
            <select
              id="role"
              name="role"
              value={role}
              onChange={(e) => setRole(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-primary-500 focus:border-primary-500"
            >
              <option value="buyer">مشتري (الافتراضي)</option>
              <option value="seller">بائع (لإنشاء المنشورات والمبيعات)</option>
            </select>
            <p className="text-xs text-gray-500 mt-1">
              يمكنك البدء كمشتري وتغيير دورك لاحقاً.
            </p>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50 transition-colors"
          >
            {loading ? "جاري إنشاء الحساب..." : "تسجيل"}
          </button>
        </form>

        <div className="mt-6 text-center">
          <p className="text-sm text-gray-600">
            هل لديك حساب بالفعل؟{" "}
            <Link
              to="/login"
              className="font-medium text-primary-600 hover:text-primary-500"
            >
              تسجيل الدخول
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default SignupPage;
