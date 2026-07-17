const express = require("express");
const router = express.Router();
const purchaseOrderController = require("../controllers/purchaseOrderController");
const { protect, restrictTo } = require("../middleware/authMiddleware");

// All routes here are under /api/v2/purchase-orders

router.post("/generate", protect, restrictTo("buyer"), purchaseOrderController.generatePO);
router.post("/:id/issue", protect, restrictTo("buyer"), purchaseOrderController.issuePO);

router.post("/:id/accept", protect, restrictTo("seller"), purchaseOrderController.acceptPO);
router.post("/:id/reject", protect, restrictTo("seller"), purchaseOrderController.rejectPO);

module.exports = router;
