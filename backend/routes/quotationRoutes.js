const express = require("express");
const router = express.Router({ mergeParams: true }); // Important if we mount on /rfqs/:id/quotes

const { submitQuotation, editQuotation, withdrawQuotation, negotiateQuotation } = require("../controllers/quotationController");
const { protect, restrictTo } = require("../middleware/authMiddleware");

// Base mount point: /api/v1 (or /api/v2/quotations)
// Routes for /api/v1/rfqs/:id/quotes
router.post("/rfqs/:id/quotes", protect, restrictTo("seller"), submitQuotation);

// Routes for /api/v1/quotes
router.put("/quotes/:id", protect, restrictTo("seller"), editQuotation);
router.patch("/quotes/:id/withdraw", protect, restrictTo("seller"), withdrawQuotation);
router.post("/quotes/:id/negotiate", protect, restrictTo("buyer"), negotiateQuotation);

module.exports = router;
