const {
  User,
  Category,
  PriceQuote,
  Deal,
  Rating,
  Sequelize,
} = require("../sequelize_setup");
const { Op } = Sequelize;

/**
 * 🎖️ Sovereign Supplier Qualification Service
 * Rules: Sector Match, Rating > 4.0, Historical Price Consistency.
 */
class SupplierQualificationService {
  /**
   * Identify the top 3 best-suited suppliers for a product category
   */
  static async getQualifiedSuppliers(categoryId, historicalAvgPrice) {
    // 1. Find sellers in the sector with high rating
    const candidates = await User.findAll({
      where: {
        role: "seller",
        buyerRating: { [Op.gte]: 4.0 },
        isActive: true,
        is_restricted: false,
      },
      include: [
        {
          model: Category,
          as: "sectors",
          where: { id: categoryId },
        },
      ],
      limit: 10,
      order: [["buyerRating", "DESC"]],
    });

    const qualified = [];
    const priceCeiling = historicalAvgPrice * 1.1; // 10% Sovereign Limit

    for (const seller of candidates) {
      // 2. Audit Historical Pricing for this seller in this sector
      const pastQuotes = await PriceQuote.findAll({
        where: {
          sellerId: seller.id,
          status: "accepted",
        },
        limit: 5,
      });

      // If new seller or consistent within ceiling, they qualify
      const isConsistent =
        pastQuotes.length === 0 ||
        pastQuotes.every((q) => {
          const price = parseFloat(q.fixedPrice) || q.priceRangeMin;
          return price <= priceCeiling;
        });

      if (isConsistent) {
        qualified.push(seller);
      }

      if (qualified.length >= 3) break; // Hard limit to 3 candidates
    }

    return qualified;
  }
}

module.exports = SupplierQualificationService;
