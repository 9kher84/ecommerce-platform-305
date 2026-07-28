/**
 * Dynamic Commission Engine
 * Dynamically calculates seller platform commission rate starting at base 5% and discounting
 * based on Seller Level, Reputation Score, Completion Rate, and Lifetime Volume down to e.g. 3.4%.
 */
class DynamicCommissionEngine {
  /**
   * Calculate final dynamic commission percentage and SAR amount
   * 
   * @param {Object} payload
   * @param {number} payload.dealAmountSAR - Total deal value in SAR
   * @param {number} [payload.reputationScore=4.5] - Seller reputation score (1 - 5)
   * @param {number} [payload.completionRatePercent=95] - Seller order completion rate %
   * @param {number} [payload.lifetimeVolumeSAR=500000] - Seller lifetime sales volume in SAR
   */
  static calculateDynamicCommission(payload) {
    const { dealAmountSAR, reputationScore = 4.5, completionRatePercent = 95, lifetimeVolumeSAR = 500000 } = payload;
    let baseRate = 5.0; // Base 5.0%

    // 1. Reputation Discount (up to -0.5%)
    if (reputationScore >= 4.8) baseRate -= 0.5;
    else if (reputationScore >= 4.5) baseRate -= 0.3;

    // 2. Completion Rate Discount (up to -0.5%)
    if (completionRatePercent >= 98) baseRate -= 0.5;
    else if (completionRatePercent >= 90) baseRate -= 0.3;

    // 3. Lifetime Volume Discount (up to -0.6%)
    if (lifetimeVolumeSAR >= 1000000) baseRate -= 0.6;
    else if (lifetimeVolumeSAR >= 250000) baseRate -= 0.3;

    // Enforce floor rate minimum of 3.0%
    const finalCommissionRatePercent = Math.max(3.0, Math.round(baseRate * 10) / 10);
    const commissionAmountSAR = Math.round((dealAmountSAR * finalCommissionRatePercent) / 100);

    return {
      dealAmountSAR,
      baseRatePercent: 5.0,
      discounts: {
        reputationDiscount: reputationScore >= 4.5 ? 0.3 : 0,
        completionDiscount: completionRatePercent >= 90 ? 0.3 : 0,
        volumeDiscount: lifetimeVolumeSAR >= 250000 ? 0.3 : 0
      },
      finalCommissionRatePercent,
      commissionAmountSAR,
      effectiveAt: new Date().toISOString()
    };
  }
}

module.exports = DynamicCommissionEngine;
