const express = require("express");
const router = express.Router();
const awardController = require("../controllers/awardController");
const { protect } = require("../middleware/authMiddleware");

// All routes here are under /api/v2/awards

router.post("/", protect, awardController.submitAward);

module.exports = router;
