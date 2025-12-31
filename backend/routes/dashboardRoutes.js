const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/authMiddleware');
const {
    getBuyerStats,
    getBuyerInvoices,
    getSellerStats,
    getSellerInvoices
} = require('../controllers/dashboardController');

// Buyer Dashboard Routes
router.get('/buyer/stats', protect, authorize('buyer'), getBuyerStats);
router.get('/buyer/invoices', protect, authorize('buyer'), getBuyerInvoices);

// Seller Dashboard Routes
router.get('/seller/stats', protect, authorize('seller'), getSellerStats);
router.get('/seller/invoices', protect, authorize('seller'), getSellerInvoices);

// ============================================================
// SOVEREIGN COMMAND DASHBOARD (Order 10)
// ============================================================
const { getCommandData } = require('../controllers/commandDashboardController');

/**
 * @swagger
 * /api/dashboard/command:
 *   get:
 *     summary: Sovereign Command Dashboard
 *     tags: [Dashboard]
 *     security:
 *       - cookieAuth: []
 *     responses:
 *       200:
 *         description: System status, logs, and pricing stats
 */
router.get('/command',
    protect,
    // authorize('admin'), // Strict access in prod
    getCommandData
);

module.exports = router;
