// C:\Users\s9khr\sasasa\ecommerce-platform\frontend\src\components\Footer.jsx

import React from "react";

const Footer = () => {
  return (
    <footer className="bg-gray-800 text-white mt-12 py-6" dir="rtl">
      <div className="container mx-auto px-4 text-center">
        <p className="text-sm">
          &copy; {new Date().getFullYear()} منصة المزايدة. جميع الحقوق محفوظة.
        </p>
        <div className="mt-2 text-xs text-gray-400 space-x-4 space-x-reverse">
          <Link to="/privacy" className="hover:text-white">
            سياسة الخصوصية
          </Link>
          <Link to="/terms" className="hover:text-white">
            شروط الاستخدام
          </Link>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
