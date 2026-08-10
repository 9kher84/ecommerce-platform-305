const {
  PurchaseRequest,
  SmartInventory,
  Product,
  Sequelize,
} = require("../sequelize_setup");
const { Op } = Sequelize;
const { generateBlindIndex } = require("../utils/encryption");

/**
 * ⚡ Sovereign Match Service - V2 OPTIMIZED
 * Uses Blind Indexes for high-performance matching on encrypted data.
 */
class MatchService {
  /**
   * Find matches using Blind Indexes (Zero Decryption Load)
   */
  static async findMatchesForRequest(requestId) {
    const request = await PurchaseRequest.findByPk(requestId);
    if (!request) return [];

    // 1. Generate Blind Index from Request Meta/Specs
    // In a real scenario, we'd hash the key specs or category + subcategory
    const specsHash = generateBlindIndex(request.description || request.title);

    // 2. HIGH PERFORMANCE QUERY
    // No ILIKE, No Decryption. Just Indexed Equality.
    const whereClause = {};
    if (request.sectorId) {
      whereClause.categoryId = request.sectorId;
    }

    const matches = await SmartInventory.findAll({
      where: {
        [Op.or]: [
          { specsBlindIndex: specsHash },
          ...(request.targetSellerId ? [{ sellerId: request.targetSellerId }] : []),
        ],
      },
      include: [
        {
          model: Product,
          as: "product",
          where: whereClause,
        },
      ],
      limit: 10,
    });

    // 3. Post-Process Scoring (Minimal Complexity)
    return matches.map((inv) => {
      const product = inv.product;
      let score = 70; // Base score for indexed match

      // Price Range Check (Efficient numeric comparison)
      const targetMin = parseFloat(request.price_range_min) || 0;
      const targetMax = parseFloat(request.price_range_max) || Infinity;
      const productPrice = parseFloat(product.estimatedPrice) || 0;

      const priceInRange =
        productPrice >= targetMin && productPrice <= targetMax;
      if (priceInRange) score += 20;

      // Date Check
      const deliveryDate = request.delivery_date
        ? new Date(request.delivery_date)
        : null;
      const hasStock = product.stockLevel > 0;
      if (hasStock) score += 10;

      let tag = "Normal";
      if (score >= 90) tag = "Gold";
      else if (score >= 80) tag = "Green";

      return {
        inventoryId: inv.id,
        productId: product.id,
        matchScore: score,
        matchTag: tag,
        productName: product.name,
        price: productPrice,
      };
    });
  }
}

module.exports = MatchService;
