// backend/services/limitService.js
const { BuyerLimit, PurchaseRequest } = require("../sequelize_setup");
const { Op } = require("sequelize");

class LimitService {
  /**
   * Increase buyer limit by 1 for every 3 completed deals
   * @param {string} buyerId
   */
  static async increaseBuyerLimit(buyerId) {
    let limit = await BuyerLimit.findOne({ where: { buyerId } });
    if (!limit) {
      limit = await BuyerLimit.create({ buyerId });
    }

    // Increment total completed deals
    limit.totalCompletedDeals += 1;

    // Logic: +1 limit for every 3 completed deals
    // currentLimit = base(3) + floor(totalCompletedDeals / 3)
    const newLimit = 3 + Math.floor(limit.totalCompletedDeals / 3);

    if (newLimit > limit.currentLimit) {
      limit.currentLimit = newLimit;
    }

    await limit.save();
    return limit;
  }

  /**
   * Check if buyer can place a new order (publish a request)
   * @param {string} buyerId
   */
  static async canPlaceOrder(buyerId) {
    const limitRecord = await BuyerLimit.findOne({ where: { buyerId } });
    const currentLimit = limitRecord ? limitRecord.currentLimit : 3;

    // Count active requests (published, under_review, quoting, awaiting_decision, accepted, deal_in_progress)
    const activeCount = await PurchaseRequest.count({
      where: {
        userId: buyerId,
        status: {
          [Op.in]: [
            "published",
            "rfq_published",
            "under_review",
            "quoting",
            "awaiting_decision",
            "accepted",
            "deal_in_progress",
          ],
        },
      },
    });

    return {
      canCreate: activeCount < currentLimit,
      activeCount,
      currentLimit,
      remaining: currentLimit - activeCount,
    };
  }

  /**
   * Get current limit info
   */
  static async getLimitInfo(buyerId) {
    const limitRecord = await BuyerLimit.findOne({ where: { buyerId } });
    return limitRecord || { buyerId, currentLimit: 3, totalCompletedDeals: 0 };
  }
}

module.exports = LimitService;
