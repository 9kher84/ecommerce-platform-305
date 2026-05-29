const express = require("express");
const router = express.Router();
const smartPricingService = require("../services/smartPricingService");
const { protect } = require("../middleware/authMiddleware");

// Order 6: All functions must use auditService (handled inside service)

/**
 * @swagger
 * /api/smart-pricing/calculate:
 *   post:
 *     summary: Calculate smart price (Sovereign Batch 3)
 *     tags: [SmartPricing]
 *     security:
 *       - cookieAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               quantity:
 *                 type: number
 *               basePrice:
 *                 type: number
 *     responses:
 *       200:
 *         description: Calculation result
 */
router.post("/calculate", protect, async (req, res, next) => {
  try {
    const result = await smartPricingService.calculatePrice(
      req.user.id,
      req.body.quantity,
      req.body.basePrice,
      req,
    );
    res.json({ success: true, price: result });
  } catch (err) {
    next(err);
  }
});

/**
 * @swagger
 * /api/smart-pricing/anomalies:
 *   get:
 *     summary: Check anomalies
 *     tags: [SmartPricing]
 *     security:
 *       - cookieAuth: []
 *     responses:
 *       200:
 *         description: Anomaly report
 */
router.get("/anomalies", protect, async (req, res, next) => {
  try {
    const report = await smartPricingService.checkAnomalies(req.user.id, req);
    res.json({ success: true, report });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
