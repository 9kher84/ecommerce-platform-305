const express = require("express");
const router = express.Router();
const purchaseOrderController = require("../controllers/purchaseOrderController");
const { protect, authorizeRole } = require("../middleware/authMiddleware");

// All routes here are under /api/v2/purchase-orders

router.post("/generate", protect, authorizeRole("buyer"), purchaseOrderController.generatePO);
router.post("/:id/issue", protect, authorizeRole("buyer"), purchaseOrderController.issuePO);

router.post("/:id/accept", protect, authorizeRole("seller"), purchaseOrderController.acceptPO);
router.post("/:id/reject", protect, authorizeRole("seller"), purchaseOrderController.rejectPO);

module.exports = router;
