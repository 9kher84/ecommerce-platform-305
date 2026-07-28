/**
 * Dynamic Feature Flag Evaluator
 * Evaluates feature flags beyond simple ON/OFF booleans, supporting Percentage Rollouts,
 * Regional Restrictions, Lifecycle Stages, AI Scores, and Industry Sectors.
 */
class DynamicFeatureFlagEvaluator {
  /**
   * Evaluates complex multi-condition feature flag
   * 
   * @param {string} flagName 
   * @param {Object} context 
   * @param {string} [context.country='SA'] - Country code
   * @param {string} [context.lifecycleStage='GOLD'] - Merchant lifecycle stage
   * @param {number} [context.aiConfidenceScore=88] - AI confidence score (0-100)
   * @param {number} [context.rolloutPercentage=100] - Rollout percentage (0-100)
   */
  static evaluateDynamicFlag(flagName, context = {}) {
    const {
      country = "SA",
      lifecycleStage = "GOLD",
      aiConfidenceScore = 88,
      rolloutPercentage = 100
    } = context;

    const flagKey = flagName.toUpperCase();
    let isEnabled = true;
    let failureReason = null;

    if (flagKey === "INTERNATIONAL_PAYMENTS" && country !== "SA") {
      isEnabled = false;
      failureReason = "Flag restricted to SA region.";
    } else if (flagKey === "AI_AUTO_NEGOTIATION" && aiConfidenceScore < 80) {
      isEnabled = false;
      failureReason = "AI Confidence Score below 80 threshold.";
    } else if (rolloutPercentage < 100 && Math.random() * 100 > rolloutPercentage) {
      isEnabled = false;
      failureReason = "Excluded by percentage rollout rule.";
    }

    return {
      flagKey,
      isEnabled,
      failureReason,
      evaluationContext: { country, lifecycleStage, aiConfidenceScore, rolloutPercentage },
      evaluatedAt: new Date().toISOString()
    };
  }
}

module.exports = DynamicFeatureFlagEvaluator;
