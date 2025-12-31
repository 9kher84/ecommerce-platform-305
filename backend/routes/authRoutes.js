const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const { protect } = require('../middleware/authMiddleware');
const { validateRegister, validateLogin } = require('../middleware/validationMiddleware');
const { authLimiter, loginLimiter } = require('../middleware/rateLimitMiddleware');

// === 1. مسارات المصادقة العامة ===

// تسجيل مستخدم جديد
router.post('/register', authLimiter, validateRegister, authController.register);

// تسجيل دخول
router.post('/login', loginLimiter, validateLogin, authController.login);

// تجديد التوكن (Rotation)
router.post('/refresh', authLimiter, authController.refresh);

// === 2. مسارات المصادقة المحمية ===

// جلب بيانات المستخدم الحالي
router.get('/me', protect, authController.getMe);

// تسجيل الخروج الآمن
router.post('/logout', protect, authController.logout);

// === 3. استعادة كلمة المرور (تضاف لاحقاً إذا لزم الأمر) ===
// router.post('/forgot-password', authController.forgotPassword);
// router.put('/reset-password/:token', authController.resetPassword);

// 🛡️ SECURITY POLICY: Impersonation is FORBIDDEN
// router.post('/impersonate', ...); -> REMOVED

module.exports = router;
