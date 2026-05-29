const express = require("express");
const router = express.Router();
const { protect } = require("../middleware/authMiddleware");
const { protectAttachment } = require("../middleware/attachmentProtection");
const attachmentController = require("../controllers/attachmentController");

/**
 * @route   GET /api/attachments/:id
 * @desc    Download attachment file (protected)
 * @access  Private (Based on request status - see Command 3)
 */
router.get(
  "/:id",
  protect, // التحقق من المصادقة
  protectAttachment, // تطبيق منطق الصلاحيات المعقد (Command 3)
  attachmentController.getAttachment,
);

module.exports = router;
