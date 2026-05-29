// C:\Users\s9khr\sasasa\ecommerce-platform\backend\controllers\notificationController.js

const { Notification, User } = require("../sequelize_setup");
const asyncHandler = require("express-async-handler");
const Joi = require("joi");

// =========================================================================
// Joi Schemas
// =========================================================================

const markAsReadSchema = Joi.object({
  // يمكن تحديد إشعار واحد (ID) أو تركها فارغة لقراءة الكل
  notificationIds: Joi.array()
    .items(Joi.number().integer().positive())
    .optional(),
  markAll: Joi.boolean().optional(),
})
  .xor("notificationIds", "markAll")
  .messages({
    "object.xor":
      'يجب تقديم إما قائمة بمعرفات الإشعارات (notificationIds) أو علامة "markAll" لقراءة جميع الإشعارات.',
  });

// =========================================================================
// Controllers
// =========================================================================

/**
 * @desc    جلب إشعارات المستخدم الحالي
 * @route   GET /api/notifications
 * @access  محمي
 */
exports.getNotifications = asyncHandler(async (req, res) => {
  const userId = req.user.id;
  const isUnread = req.query.unread === "true"; // فلترة اختيارية للإشعارات غير المقروءة

  const whereCondition = {
    recipientId: userId,
  };

  if (isUnread) {
    whereCondition.isRead = false;
  }

  const notifications = await Notification.findAll({
    where: whereCondition,
    order: [["createdAt", "DESC"]],
    limit: parseInt(req.query.limit) || 20,
    offset: parseInt(req.query.offset) || 0,
  });

  // جلب عدد الإشعارات غير المقروءة لتمييزها في الواجهة الأمامية
  const unreadCount = await Notification.count({
    where: { recipientId: userId, isRead: false },
  });

  res.status(200).json({
    success: true,
    count: notifications.length,
    unreadCount: unreadCount,
    notifications,
  });
});

/**
 * @desc    تحديد إشعار (أو مجموعة إشعارات) كمقروء
 * @route   PATCH /api/notifications/read
 * @access  محمي
 */
exports.markNotificationsAsRead = asyncHandler(async (req, res) => {
  const userId = req.user.id;

  const { error, value } = markAsReadSchema.validate(req.body);

  if (error) {
    res.status(400);
    throw new Error(error.details.map((d) => d.message).join(", "));
  }

  const { notificationIds, markAll } = value;

  // الشروط الأولية: الإشعارات المستهدفة هي للمستخدم الحالي وغير مقروءة
  const whereCondition = {
    recipientId: userId,
    isRead: false,
  };

  if (notificationIds) {
    // تحديد إشعارات معينة فقط
    whereCondition.id = notificationIds;
  } else if (markAll) {
    // إذا كان markAll صحيحاً، فإن whereCondition تشمل جميع الإشعارات غير المقروءة للمستخدم
  } else {
    // لن يصل الكود إلى هنا بسبب Joi.xor، لكن كحماية
    res.status(400);
    throw new Error("الرجاء تحديد الإشعارات المراد قراءتها.");
  }

  // تحديث الحالة
  const [updatedCount] = await Notification.update(
    { isRead: true },
    { where: whereCondition },
  );

  if (updatedCount === 0) {
    return res.status(200).json({
      success: true,
      message: "لا توجد إشعارات جديدة لتحديدها كمقروءة.",
      updatedCount: 0,
    });
  }

  res.status(200).json({
    success: true,
    message: `تم تحديد ${updatedCount} إشعار (إشعارات) كمقروءة بنجاح.`,
    updatedCount,
  });
});
