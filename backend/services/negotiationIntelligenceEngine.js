/**
 * Negotiation Intelligence Engine
 * Intelligent AI Buyer vs AI Seller negotiation strategy engine.
 * Evaluates target margins, win probabilities, counter-offer rounds, and optimal discount thresholds.
 */
class NegotiationIntelligenceEngine {
  /**
   * Evaluate quotation and generate AI Counter-Offer Recommendation
   * 
   * @param {Object} payload
   * @param {number} payload.originalQuotePrice - Initial quoted price
   * @param {number} payload.targetBudget - Buyer target budget
   * @param {number} [payload.currentRound=1] - Active negotiation round number
   * @param {string} [payload.strategy='BALANCED'] - Strategy ('AGGRESSIVE' | 'BALANCED' | 'RELATIONSHIP')
   */
  static evaluateCounterOffer(payload) {
    const { originalQuotePrice, targetBudget, currentRound = 1, strategy = "BALANCED" } = payload;
    const startTime = Date.now();

    if (!originalQuotePrice || !targetBudget) {
      throw new Error("NegotiationEngine requires originalQuotePrice and targetBudget.");
    }

    const priceDiff = originalQuotePrice - targetBudget;
    const variancePercent = (priceDiff / targetBudget) * 100;

    // Determine target discount percentage based on strategy
    let discountTargetPercent = 5; // Default 5%
    if (strategy === "AGGRESSIVE") discountTargetPercent = 12;
    else if (strategy === "RELATIONSHIP") discountTargetPercent = 3;

    // Compute counter-offer price
    const suggestedDiscountAmount = (originalQuotePrice * discountTargetPercent) / 100;
    const recommendedCounterPrice = Math.max(targetBudget, Math.round(originalQuotePrice - suggestedDiscountAmount));

    // Calculate win probability
    const winProbability = Math.max(40, Math.min(95, Math.round(100 - (discountTargetPercent * 3.5) - (currentRound * 5))));

    return {
      success: true,
      originalQuotePrice,
      targetBudget,
      currentRound,
      strategy,
      analysis: {
        variancePercent: Math.round(variancePercent),
        suggestedDiscountPercent: discountTargetPercent,
        recommendedCounterPrice,
        estimatedSavingsSAR: originalQuotePrice - recommendedCounterPrice,
        winProbabilityPercent: winProbability
      },
      reasoning: `AI Strategy (${strategy}): Recommended counter-offer at SAR ${recommendedCounterPrice} (${discountTargetPercent}% discount) with a estimated win probability of ${winProbability}%.`,
      processingTimeMs: Date.now() - startTime
    };
  }
}

module.exports = NegotiationIntelligenceEngine;
