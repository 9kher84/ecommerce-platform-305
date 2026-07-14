const express = require("express");
const router = express.Router({ mergeParams: true }); // Important if we mount on /rfqs/:id/quotes

const { submitQuotation, editQuotation, withdrawQuotation, negotiateQuotation } = require("../controllers/quotationController");
const { protect, authorizeRole } = require("../middleware/authMiddleware");

// Base mount point: /api/v1 (or /api/v2/quotations)
// Routes for /api/v1/rfqs/:id/quotes
router.post("/rfqs/:id/quotes", protect, authorizeRole("seller"), submitQuotation);

// Routes for /api/v1/quotes
router.put("/quotes/:id", protect, authorizeRole("seller"), editQuotation);
router.patch("/quotes/:id/withdraw", protect, authorizeRole("seller"), withdrawQuotation);
router.post("/quotes/:id/negotiate", protect, authorizeRole("buyer"), negotiateQuotation);

module.exports = router;
