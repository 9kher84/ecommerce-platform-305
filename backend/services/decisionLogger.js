const { SellerDecision } = require("../sequelize_setup");

class DecisionLogger {
  /**
   * @desc Log a seller's decision compared to a smart recommendation
   */
  static async logDecision({
    userId,
    requestId,
    recommendation,
    actualDecision,
    actualPrice,
  }) {
    const startTime = Date.now(); // In a real flow, this would be tracked from when they opened the request

    // Calculate profit margin if price is available
    const profitMargin =
      actualPrice && recommendation.breakEven
        ? ((actualPrice - recommendation.breakEven) / actualPrice) * 100
        : null;

    const decision = await SellerDecision.create({
      userId,
      requestId,
      action: actualDecision, // 'accept', 'reject', 'counter'
      recommendedPrice: recommendation.suggestedPrice,
      actualPrice: actualPrice,
      profitMargin,
      decisionTime: 0, // Mocked for now
      reasoningMatch:
        Math.abs((actualPrice || 0) - (recommendation.suggestedPrice || 0)) <
        recommendation.suggestedPrice * 0.05,
    });

    console.log(
      `📊 Decision Logged for User ${userId} on Request ${requestId}`,
    );
    return decision;
  }

  /**
   * @desc Get historical trends for a user (Plan A/B only)
   */
  static async getRecentDecisionTrends(userId) {
    const decisions = await SellerDecision.findAll({
      where: { userId },
      limit: 5,
      order: [["createdAt", "DESC"]],
    });

    return decisions.map((d) => ({
      date: d.createdAt,
      action: d.action,
      followedRecommendation: d.reasoningMatch,
      margin: d.profitMargin,
    }));
  }
}

module.exports = DecisionLogger;
