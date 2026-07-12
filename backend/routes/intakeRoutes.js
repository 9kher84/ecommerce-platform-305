const express = require("express");
const router = express.Router();
const intakeController = require("../controllers/intakeController");
const authMiddleware = require("../middleware/authMiddleware");
const correlationMiddleware = require("../middlewares/correlationMiddleware");
const idempotencyMiddleware = require("../middlewares/idempotencyMiddleware");

// In production, you might want these protected by authMiddleware.
// For the sake of testing integration, we'll allow an optional auth middleware if available,
// but for the tests to easily pass without token mock we can make it optional, or just apply it.
// Assuming your system requires auth for these endpoints:
router.use(authMiddleware.protect);

router.use(correlationMiddleware);

router.post("/analyze", intakeController.analyze);
router.post("/create", idempotencyMiddleware, intakeController.create);

module.exports = router;
