const {
  PriceQuote,
  PurchaseRequest,
  Product,
  Category,
  sequelize,
} = require("../sequelize_setup");
const { Op } = require("sequelize");

class PricingEngine {
  /**
   * @desc Get Sector Market Average Price (Last 30 days)
   */
  static async getSectorMarketPrice(sectorId) {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const stats = await PriceQuote.findOne({
      include: [
        {
          model: PurchaseRequest,
          as: "request",
          where: { sectorId, createdAt: { [Op.gte]: thirtyDaysAgo } },
          attributes: [],
        },
      ],
      attributes: [
        [sequelize.fn("AVG", sequelize.cast(sequelize.col("amount"), "numeric")), "avgPrice"],
        [sequelize.fn("MIN", sequelize.cast(sequelize.col("amount"), "numeric")), "minPrice"],
        [sequelize.fn("MAX", sequelize.cast(sequelize.col("amount"), "numeric")), "maxPrice"],
      ],
      raw: true,
    });

    return {
      average: parseFloat(stats.avgPrice || 0),
      min: parseFloat(stats.minPrice || 0),
      max: parseFloat(stats.maxPrice || 0),
    };
  }

  /**
   * @desc Calculate Break-Even for a specific product
   */
  static async calculateBreakEven(product) {
    // Break-even = Purchase Price + Storage Cost + Estimated Delivery (10% of purchase price as buffer)
    const purchasePrice = parseFloat(product.purchasePrice || 0);
    const storageCost = parseFloat(product.storageCost || 0);
    const deliveryBuffer = purchasePrice * 0.1;

    return purchasePrice + storageCost + deliveryBuffer;
  }

  /**
   * @desc Generate Sovereign Smart Recommendation
   */
  static async generatePriceRecommendation(user, request, product) {
    const sectorPrice = await this.getSectorMarketPrice(
      request.sectorId || request.categoryId,
    );
    const breakEven = await this.calculateBreakEven(product);
    const maturity = user.maturity_level || "BASIC";

    let recommendation = {
      suggestedPrice: sectorPrice.average || breakEven * 1.2,
      reasoning: [],
      confidence: 0.8,
    };

    // --- Maturity Logic ---
    if (maturity === "BASIC") {
      // Simplified words for BASIC
      const marketSignal =
        recommendation.suggestedPrice > sectorPrice.average
          ? "سعر مرتفع"
          : "سعر جيد";
      recommendation.reasoning = [
        `إشارة السوق: ${marketSignal}`,
        "توصية: يفضل اتباع متوسط أسعار القطاع",
      ];
      recommendation.suggestedPrice = Math.round(recommendation.suggestedPrice); // Rounded for simplicity
    } else if (maturity === "GUIDED") {
      // Explained medium detail for GUIDED
      recommendation.reasoning = [
        `السعر المقترح: ${recommendation.suggestedPrice.toFixed(2)}`,
        `بناءً على متوسط سوق القطاع: ${sectorPrice.average.toFixed(2)}`,
        `نطاق السوق الحالي: ${sectorPrice.min.toFixed(2)} - ${sectorPrice.max.toFixed(2)}`,
      ];
    } else if (maturity === "ADVANCED") {
      // Detailed numeric/technical for ADVANCED
      recommendation.reasoning = [
        `السعر الأمثل المكتشف: ${recommendation.suggestedPrice.toFixed(2)}`,
        `تحليل نقطة التعادل: ${breakEven.toFixed(2)}`,
        `المخزون الحالي: ${product.stockLevel} وحدة`,
        `هامش الربح المتوقع: ${(((recommendation.suggestedPrice - breakEven) / recommendation.suggestedPrice) * 100).toFixed(2)}%`,
      ];
      recommendation.confidence = 0.92;
    }

    // --- Tier A/B Enhancements (Keep secondary logic but within maturity style) ---
    if (
      user.subscriptionTier === "plan_a" ||
      user.subscriptionTier === "plan_b"
    ) {
      const suggestedMargin = breakEven * 1.15;
      if (recommendation.suggestedPrice < suggestedMargin) {
        recommendation.suggestedPrice = suggestedMargin;
        if (maturity !== "BASIC")
          recommendation.reasoning.push(`تم التعديل لضمان هامش ربح 15%`);
      }
    }

    // --- Safety Limit ---
    const absoluteMin = breakEven * 0.7;
    if (recommendation.suggestedPrice < absoluteMin) {
      recommendation.suggestedPrice = absoluteMin;
      recommendation.reasoning.push("تنبيه سيادي: السعر عند الحد الأدنى الآمن");
    }

    return recommendation;
  }
}

module.exports = PricingEngine;
