const express = require("express");
const router = express.Router();
const { protect } = require("../middleware/authMiddleware");
const { getCatalogMetrics } = require("../controllers/SystemController");

router.get("/catalog-metrics", protect, getCatalogMetrics);

module.exports = router;
