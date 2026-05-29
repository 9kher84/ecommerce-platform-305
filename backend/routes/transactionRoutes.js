const express = require("express");
const router = express.Router();
const transactionController = require("../controllers/transactionController");
const { protect, restrictTo } = require("../middleware/authMiddleware");

// ----------------------------------------------------------------------
// 1. مسارات الإغلاق (للبائع)
// ----------------------------------------------------------------------

router
  .route("/finalize/:postId")
  // POST /api/transactions/finalize/:postId: إغلاق الصفقة
  // محمي ومقيد للبائعين فقط
  .post(
    protect,
    restrictTo("seller", "admin", "super_admin"),
    transactionController.finalizeTransaction,
  );

// ----------------------------------------------------------------------
// 2. مسارات التقارير (للمسؤول)
// ----------------------------------------------------------------------

router
  .route("/")
  // GET /api/transactions: جلب جميع الصفقات
  // محمي ومقيد للمسؤولين فقط
  .get(
    protect,
    restrictTo("admin", "super_admin"),
    transactionController.getAllTransactions,
  );

module.exports = router;
