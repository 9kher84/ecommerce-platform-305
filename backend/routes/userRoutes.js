const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const authController = require('../controllers/authController');
const { protect, restrictTo } = require('../middleware/authMiddleware');
const { validateRegister, validateLogin, validateUpdateProfile } = require('../middleware/validationMiddleware');

// ----------------------------------------------------------------------
// 1. مسارات المصادقة (Auth - متاحة للجميع)
// ----------------------------------------------------------------------
// POST /api/users/register
router.post('/register', validateRegister, authController.register);

// POST /api/users/login
router.post('/login', validateLogin, authController.login);

// ----------------------------------------------------------------------
// 2. مسارات الملف الشخصي (Profile - محمي)
// ----------------------------------------------------------------------

router.route('/profile')
    // GET /api/users/profile - جلب الملف الشخصي
    .get(protect, userController.getUserProfile)
    // PUT /api/users/profile - تحديث الملف الشخصي
    .put(protect, validateUpdateProfile, userController.updateUserProfile);

// ----------------------------------------------------------------------
// 3. مسارات إدارة المسؤولين (Admin Management - محمي للمسؤولين فقط)
// ----------------------------------------------------------------------

// ⚠️ SECURITY FIX: Removed unprotected /all route
// GET /api/users/admin/all - جلب جميع المستخدمين (محمي للمسؤولين فقط)
router.get('/admin/all', protect, restrictTo('admin', 'super_admin'), userController.getAllUsers);

router.route('/admin/:id')
    // GET /api/users/admin/:id - جلب مستخدم واحد
    .get(protect, restrictTo('admin', 'super_admin'), userController.getUserById)
    // PUT /api/users/admin/:id - تحديث مستخدم
    .put(protect, restrictTo('admin', 'super_admin'), userController.updateUserById)
    // DELETE /api/users/admin/:id - حذف مستخدم
    .delete(protect, restrictTo('admin', 'super_admin'), userController.deleteUser);


module.exports = router;