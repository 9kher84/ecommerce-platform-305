// backend/routes/notificationRoutes.js

const express = require("express");
const router = express.Router();
const { protect } = require("../middleware/authMiddleware");
const asyncHandler = require("express-async-handler");

// حماية جميع مسارات الإشعارات
router.use(protect);

/**
 * @route   GET /api/notifications
 * @desc    جلب إشعارات المستخدم الحالي مع Pagination
 */
router.get(
  "/",
  asyncHandler(async (req, res) => {
    const { Notification } = require("../sequelize_setup");
    const userId = req.user.id;
    const { page = 1, limit = 20, unreadOnly } = req.query;
    const where = { recipientId: userId };
    if (unreadOnly === "true") where.isRead = false;
    const offset = (parseInt(page) - 1) * parseInt(limit);
    const { count, rows } = await Notification.findAndCountAll({
      where,
      order: [["createdAt", "DESC"]],
      limit: parseInt(limit),
      offset,
    });
    res.status(200).json({
      success: true,
      count,
      totalPages: Math.ceil(count / parseInt(limit)),
      currentPage: parseInt(page),
      data: rows,
    });
  }),
);

/**
 * @route   GET /api/notifications/unread-count
 * @desc    عدد الإشعارات غير المقروءة
 */
router.get(
  "/unread-count",
  asyncHandler(async (req, res) => {
    const { Notification } = require("../sequelize_setup");
    const count = await Notification.count({
      where: { recipientId: req.user.id, isRead: false },
    });
    res.status(200).json({ success: true, count });
  }),
);

/**
 * @route   PATCH /api/notifications/read-all
 * @desc    تحديد جميع الإشعارات كمقروءة
 */
router.patch(
  "/read-all",
  asyncHandler(async (req, res) => {
    const { Notification } = require("../sequelize_setup");
    const [updated] = await Notification.update(
      { isRead: true },
      { where: { recipientId: req.user.id, isRead: false } },
    );
    res
      .status(200)
      .json({ success: true, message: `تم تحديد ${updated} إشعار كمقروء` });
  }),
);

/**
 * @route   PATCH /api/notifications/read (legacy compat)
 * @desc    تحديد إشعار أو أكثر كمقروء
 */
router.patch(
  "/read",
  asyncHandler(async (req, res) => {
    const { Notification } = require("../sequelize_setup");
    const { ids } = req.body;
    const where = { recipientId: req.user.id };
    if (ids && Array.isArray(ids)) where.id = ids;
    const [updated] = await Notification.update({ isRead: true }, { where });
    res
      .status(200)
      .json({ success: true, message: `تم تحديد ${updated} إشعار كمقروء` });
  }),
);

/**
 * @route   PATCH /api/notifications/:id/read
 * @desc    تحديد إشعار واحد كمقروء
 */
router.patch(
  "/:id/read",
  asyncHandler(async (req, res) => {
    const { Notification } = require("../sequelize_setup");
    const notification = await Notification.findOne({
      where: { id: req.params.id, recipientId: req.user.id },
    });
    if (!notification) {
      res.status(404);
      throw new Error("الإشعار غير موجود");
    }
    await notification.update({ isRead: true });
    res.status(200).json({ success: true, data: notification });
  }),
);

/**
 * @route   DELETE /api/notifications/:id
 * @desc    حذف إشعار
 */
router.delete(
  "/:id",
  asyncHandler(async (req, res) => {
    const { Notification } = require("../sequelize_setup");
    const notification = await Notification.findOne({
      where: { id: req.params.id, recipientId: req.user.id },
    });
    if (!notification) {
      res.status(404);
      throw new Error("الإشعار غير موجود");
    }
    await notification.destroy();
    res.status(200).json({ success: true, message: "تم حذف الإشعار" });
  }),
);

module.exports = router;
