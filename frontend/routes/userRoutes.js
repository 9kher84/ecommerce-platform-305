const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const authController = require('../controllers/authController');
const { protect, restrictTo } = require('../middleware/authMiddleware'); // استيراد دوال الحماية والأدوار

// ----------------------------------------------------------------------
// 1. مسارات المصادقة (Auth Routes)
// ----------------------------------------------------------------------

// POST /api/v1/users/signup
router.post('/signup', authController.signup);

// POST /api/v1/users/login
router.post('/login', authController.login);

// POST /api/v1/users/forgotPassword
router.post('/forgotPassword', authController.forgotPassword);

// PATCH /api/v1/users/resetPassword/:token
router.patch('/resetPassword/:token', authController.resetPassword);

// ----------------------------------------------------------------------
// 2. مسارات الملف الشخصي (Protected Routes)
// ----------------------------------------------------------------------

// Middleware لتطبيق الحماية على جميع المسارات التالية
// يجب على المستخدم أن يكون مسجل الدخول لاستخدام هذه المسارات
router.use(protect);

// GET /api/v1/users/me (عرض الملف الشخصي للمستخدم الحالي)
router.get('/me', userController.getMe, userController.getUser);

// PATCH /api/v1/users/updateMyPassword (تحديث كلمة المرور)
router.patch('/updateMyPassword', authController.updatePassword);

// PATCH /api/v1/users/updateMe (تحديث البيانات الشخصية)
router.patch('/updateMe', userController.updateMe);

// DELETE /api/v1/users/deleteMe (تعطيل الحساب)
router.delete('/deleteMe', userController.deleteMe);


// ----------------------------------------------------------------------
// 3. مسارات إدارة المسؤولين (Admin Management Routes)
// ----------------------------------------------------------------------

// Middleware لتقييد الوصول على جميع المسارات التالية لدور "super_admin" فقط
router.use(restrictTo('super_admin'));

// GET /api/v1/users (جلب جميع المستخدمين)
// POST /api/v1/users (إنشاء مستخدم جديد - يفضل استخدام مسار التسجيل)
// هذه المسارات يتم استخدامها من قبل المدير فقط لإدارة المستخدمين
router
    .route('/')
    .get(userController.getAllUsers)
    .post(userController.createUser);

// مسار محدد بمعرف المستخدم
router
    .route('/:id')
    .get(userController.getUser)
    .patch(userController.updateUser)
    .delete(userController.deleteUser);


module.exports = router;