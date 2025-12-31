// C:\Users\s9khr\sasasa\ecommerce-platform\backend\routes\notificationRoutes.js

const express = require('express');
const router = express.Router();
const notificationController = require('../controllers/notificationController');
const { protect } = require('../middleware/authMiddleware');

// حماية جميع مسارات الإشعارات
router.use(protect);

router.route('/')
    // GET /api/notifications: جلب جميع إشعارات المستخدم
    .get(notificationController.getNotifications);

// PATCH /api/notifications/read: تحديد إشعار أو أكثر كمقروء
router.patch('/read', notificationController.markNotificationsAsRead);

module.exports = router;