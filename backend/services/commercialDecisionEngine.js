/**
 * Commercial Decision Engine
 * Centralized decision engine evaluating multi-attribute context (Seller Gold badge, commitment rate %,
 * VIP buyer status, market inflation trend, government tender flag, backup supplier availability)
 * to output automated commercial decisions.
 */
class CommercialDecisionEngine {
  /**
   * Make a commercial decision for deal processing or awarding
   * 
   * @param {Object} context
   * @param {boolean} [context.isGoldSeller=true] - Is seller gold verified
   * @param {number} [context.sellerCommitmentRatePercent=98.6] - Seller commitment rate %
   * @param {boolean} [context.isVipBuyer=true] - Is buyer VIP
   * @param {boolean} [context.isGovernmentTender=false] - Is government tender
   * @param {boolean} [context.hasBackupSupplier=true] - Are backups available
   */
  static makeCommercialDecision(context = {}) {
    const {
      isGoldSeller = true,
      sellerCommitmentRatePercent = 98.6,
      isVipBuyer = true,
      isGovernmentTender = false,
      hasBackupSupplier = true
    } = context;

    let score = 0;
    const decisionFactors = [];

    if (isGoldSeller) {
      score += 30;
      decisionFactors.push("Gold Verified Supplier (+30)");
    }

    if (sellerCommitmentRatePercent >= 95) {
      score += 30;
      decisionFactors.push("High SLA Commitment Rate >= 95% (+30)");
    }

    if (isVipBuyer) {
      score += 20;
      decisionFactors.push("VIP Buyer Fast-Track (+20)");
    }

    if (hasBackupSupplier) {
      score += 20;
      decisionFactors.push("Backup Suppliers Cascading Lock Available (+20)");
    }

    const decision = score >= 70 ? "APPROVE_AUTOMATED_AWARD" : score >= 40 ? "REQUIRE_MANUAL_REVIEW" : "REJECT_RISK_HIGH";

    return {
      score,
      decision,
      isAutoApproved: decision === "APPROVE_AUTOMATED_AWARD",
      decisionFactors,
      evaluatedAt: new Date().toISOString()
    };
  }
}

module.exports = CommercialDecisionEngine;
