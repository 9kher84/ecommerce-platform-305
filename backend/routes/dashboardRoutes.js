const express = require("express");
const router = express.Router();
const { protect, restrictTo } = require("../middleware/authMiddleware");
const {
  getBuyerStats,
  getBuyerInvoices,
  getSellerStats,
  getSellerInvoices,
  getAdminStats,
} = require("../controllers/dashboardController");

// Buyer Dashboard Routes
router.get("/buyer/stats", protect, restrictTo("buyer"), getBuyerStats);
router.get("/buyer/invoices", protect, restrictTo("buyer"), getBuyerInvoices);

// Seller Dashboard Routes
router.get("/seller/stats", protect, restrictTo("seller"), getSellerStats);
router.get(
  "/seller/invoices",
  protect,
  restrictTo("seller"),
  getSellerInvoices,
);

// ============================================================
// SOVEREIGN COMMAND DASHBOARD (Owner/Admin only)
// ============================================================
const {
  getCommandData,
  getMatchRadar,
} = require("../controllers/commandDashboardController");

router.get("/match-radar", protect, getMatchRadar);

/**
 * @route   GET /api/dashboard/command
 * @desc    Sovereign Command Dashboard - system stats, audit, pricing
 * @access  Admin / Owner only
 */
router.get(
  "/command",
  protect,
  restrictTo("admin", "super_admin", "owner"), // أزلنا التعليق وحمينا المسار
  getCommandData,
);

const { isAdmin, hasPermission } = require("../middleware/adminMiddleware");

router.get(
  "/admin/stats",
  protect,
  isAdmin,
  hasPermission("manage_users"),
  getAdminStats
);

module.exports = router;
