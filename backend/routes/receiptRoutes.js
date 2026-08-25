const express = require("express");
const router = express.Router();
const receiptController = require("../controllers/receiptController");
const { protect, restrictTo } = require("../middleware/authMiddleware");

// All routes under /api/v2/receipts (Buyer access only)
// Explicit route ordering: summary route BEFORE parameterized routes
router.get("/po/:poId/summary", protect, restrictTo("buyer"), receiptController.getReceiptSummary);

router.post("/", protect, restrictTo("buyer"), receiptController.logReceipt);
router.post("/:receiptId/accept", protect, restrictTo("buyer"), receiptController.acceptReceipt);

module.exports = router;
