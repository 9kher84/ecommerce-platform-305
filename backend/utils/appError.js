// C:\Users\s9khr\sasasa\ecommerce-platform\backend\utils\appError.js

class AppError extends Error {
  constructor(message, statusCode) {
    // نمرر رسالة الخطأ إلى الكلاس الأب (Error)
    super(message);

    this.statusCode = statusCode;
    // نحدد حالة الخطأ: 'fail' لـ 4xx (خطأ عميل) و 'error' لـ 5xx (خطأ خادم)
    this.status = `${statusCode}`.startsWith("4") ? "fail" : "error";
    this.isOperational = true;

    // تسجيل مسار تتبع الخطأ لتسهيل عملية التصحيح
    Error.captureStackTrace(this, this.constructor);
  }
}

module.exports = AppError;
