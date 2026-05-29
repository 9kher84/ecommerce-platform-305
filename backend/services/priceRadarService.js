const {
  PriceQuote,
  PurchaseRequest,
  Sequelize,
} = require("../sequelize_setup");
const { Op } = Sequelize;

class PriceRadarService {
  /**
   * Get Price Radar Statistics for a specific Sector
   * Calculates Pulse (Count), Min, Max, and Average over the last 30 days.
   *
   * Logic:
   * - Fixed Price: Use fixedPrice or amount.
   * - Flexible Price:
   *      - Min: priceRangeMin
   *      - Max: priceRangeMax
   *      - Avg: (Min + Max) / 2
   *
   * @param {number} sectorId
   * @returns {Object} { totalQuotes, lowestPrice, highestPrice, averagePrice }
   */
  static async getSectorStats(sectorId) {
    if (!sectorId) throw new Error("Sector ID is required");

    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    console.log(
      `📡 PriceRadar: Scanning Sector ${sectorId} since ${thirtyDaysAgo.toISOString()}...`,
    );

    try {
      const stats = await PriceQuote.findOne({
        attributes: [
          // Sector Pulse (Volume)
          [
            Sequelize.fn("COUNT", Sequelize.col("PriceQuote.id")),
            "totalQuotes",
          ],

          // Lowest Price (Market Floor)
          [
            Sequelize.fn(
              "MIN",
              Sequelize.literal(`
                        CASE 
                            WHEN "PriceQuote"."priceType" = 'fixed' THEN COALESCE("PriceQuote"."fixedPrice", "PriceQuote"."amount")
                            ELSE "PriceQuote"."priceRangeMin"
                        END
                    `),
            ),
            "lowestPrice",
          ],

          // Highest Price (Market Ceiling)
          [
            Sequelize.fn(
              "MAX",
              Sequelize.literal(`
                        CASE 
                            WHEN "PriceQuote"."priceType" = 'fixed' THEN COALESCE("PriceQuote"."fixedPrice", "PriceQuote"."amount")
                            ELSE "PriceQuote"."priceRangeMax"
                        END
                    `),
            ),
            "highestPrice",
          ],

          // Average Price (Market Mean)
          [
            Sequelize.fn(
              "AVG",
              Sequelize.literal(`
                        CASE 
                            WHEN "PriceQuote"."priceType" = 'fixed' THEN COALESCE("PriceQuote"."fixedPrice", "PriceQuote"."amount")
                            ELSE ("PriceQuote"."priceRangeMin" + "PriceQuote"."priceRangeMax") / 2.0
                        END
                    `),
            ),
            "averagePrice",
          ],
        ],
        include: [
          {
            model: PurchaseRequest,
            as: "request",
            attributes: [],
            where: { sectorId: sectorId },
          },
        ],
        where: {
          createdAt: { [Op.gte]: thirtyDaysAgo },
          status: { [Op.ne]: "withdrawn" }, // Exclude withdrawn quotes
        },
        raw: true,
      });

      const result = {
        sectorId,
        period: "30d",
        totalQuotes: parseInt(stats.totalQuotes || 0),
        lowestPrice: parseFloat(stats.lowestPrice || 0).toFixed(2),
        highestPrice: parseFloat(stats.highestPrice || 0).toFixed(2),
        averagePrice: parseFloat(stats.averagePrice || 0).toFixed(2),
        confidenceScore:
          parseInt(stats.totalQuotes || 0) > 10
            ? "HIGH"
            : parseInt(stats.totalQuotes || 0) > 3
              ? "MEDIUM"
              : "LOW",
      };

      console.log(`📊 PriceRadar Result:`, result);
      return result;
    } catch (error) {
      console.error("❌ PriceRadar Error:", error);
      // Return empty stats on error rather than crashing
      return {
        sectorId,
        period: "30d",
        totalQuotes: 0,
        lowestPrice: 0,
        highestPrice: 0,
        averagePrice: 0,
        error: error.message,
      };
    }
  }
}

module.exports = PriceRadarService;
