// C:\Users\s9khr\sasasa\ecommerce-platform\backend\utils\catchAsync.js

/**
 * دالة مساعدة لتغليف الدوال غير المتزامنة (Async Functions) في Express
 * لمعالجة أي أخطاء تلقائياً وتمريرها إلى معالج الأخطاء الشامل.
 */
module.exports = fn => {
    return (req, res, next) => {
        // يتم استدعاء الدالة غير المتزامنة (fn)
        // إذا فشلت (رمت خطأ)، يتم تمرير الخطأ إلى next()، 
        // مما ينقله إلى globalErrorHandler.
        fn(req, res, next).catch(next);
    };
};