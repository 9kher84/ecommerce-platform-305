const express = require("express");
const reportController = require("../controllers/reportController");
const { protect, restrictTo } = require("../middleware/authMiddleware");

const router = express.Router();

// جميع مسارات البلاغات تتطلب حماية المصادقة أولاً
router.use(protect);

// ----------------------------------------------------------------------
// 1. مسارات المستخدم والإدارة (POST & GET All)
// ----------------------------------------------------------------------
router
  .route("/")
  // POST /api/reports: تقديم بلاغ جديد (متاح للجميع)
  .post(reportController.createReport)
  // GET /api/reports: جلب جميع البلاغات (مقيد بالمسؤول)
  .get(restrictTo("admin", "super_admin"), reportController.getReports);

// ----------------------------------------------------------------------
// 2. مسارات الإدارة (تحديث الحالة)
// ----------------------------------------------------------------------
router
  .route("/:id/status")
  // PATCH /api/reports/:id/status: تحديث حالة البلاغ (مقيد بالمسؤول)
  .patch(
    restrictTo("admin", "super_admin"),
    reportController.updateReportStatus,
  );

module.exports = router;
