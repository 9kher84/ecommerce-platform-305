// backend/middleware/errorMiddleware.js

/**
 * @desc معالج للمسارات غير الموجودة (404)
 * يرمي خطأ إلى معالج الأخطاء العام.
 */
const notFound = (req, res, next) => {
    const error = new Error(`المسار غير موجود - ${req.originalUrl}`);
    res.status(404);
    next(error);
};

/**
 * @desc معالج الأخطاء العام
 * يلتقط أي خطأ يتم إلقاؤه في المتحكمات ويرسل استجابة JSON موحدة.
 */
const errorHandler = (err, req, res, next) => {
    // تحديد رمز الحالة: استخدام رمز الخطأ (إذا وجد) أو رمز الاستجابة الحالي
    // إذا كان الرمز 200 وغير محدد في الخطأ، نعتبره 500
    let statusCode = res.statusCode === 200 ? 500 : res.statusCode;
    if (err.statusCode) {
        statusCode = err.statusCode;
    }

    res.status(statusCode);

    // إرسال استجابة JSON
    res.json({
        message: err.message,
        // إظهار Stack Trace فقط في وضع التطوير (Development)
        stack: process.env.NODE_ENV === 'production' ? null : err.stack,
    });
};

module.exports = { notFound, errorHandler };