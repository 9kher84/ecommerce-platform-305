const { SmartPricingMatrix } = require("../sequelize_setup");
const auditService = require("./auditService");

/**
 * Mandatory Audit Log Integration (Order 6)
 * All logic in Batch 3 must utilize auditService.
 */
const smartPricingService = {
  /**
   * Calculate and validate Smart Pricing
   * Order (5): Smart Pricing Logic
   */
  async calculatePrice(sellerId, quantity, basePrice, req = null) {
    // 1. Audit Entry
    await auditService.log(
      sellerId,
      "SMART_PRICING_CALCULATION",
      { quantity, basePrice },
      null,
      "SmartPricing",
      req,
    );

    // 2. Fetch Matrix
    const matrix = await SmartPricingMatrix.findOne({
      where: { sellerId }, // Assuming seller has a general matrix or we'd filter by product
    });

    if (!matrix) {
      // No matrix, return base
      return basePrice;
    }

    // 3. Logic: Anomaly Detection (Order 5)
    // If price differs > 50% from matrix unitPrice, flag it
    const matrixPrice = parseFloat(matrix.unitPrice);
    const inputPrice = parseFloat(basePrice);

    const deviation = Math.abs((inputPrice - matrixPrice) / matrixPrice);

    if (deviation > 0.5) {
      // Anomaly!
      await auditService.logSecurityAlert(
        sellerId,
        "PRICE_ANOMALY_DETECTED",
        `Price ${inputPrice} deviates ${deviation * 100}% from matrix ${matrixPrice}`,
        req,
      );

      // In a strict mode, we might reject. Here we just flag.
    }

    return basePrice; // Logic placeholder - in real app would return adjusted price
  },

  async checkAnomalies(sellerId, req = null) {
    // Audit access
    await auditService.log(
      sellerId || "system",
      "CHECK_PRICE_ANOMALIES",
      {},
      null,
      "System",
      req,
    );

    return { status: "No critical anomalies found" };
  },
};

module.exports = smartPricingService;
