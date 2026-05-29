const { PurchaseRequest, Notification, User } = require("../sequelize_setup");
const { logSilentProfile } = require("./silentRiskProfiler");

/**
 * Handle Market Opportunity Notifications.
 * Sovereign Rule: Only notify for OPEN requests, exclude sanctioned sellers, Strict Limits.
 *
 * @param {string} sellerId - The ID of the seller adding the product
 * @param {number} categoryId - The category of the new product
 */
exports.processProductOpportunity = async (sellerId, categoryId) => {
  try {
    // 1. Sanction Check
    const seller = await User.findByPk(sellerId, {
      attributes: ["is_restricted", "isActive", "adminStatus"],
    });
    if (
      !seller ||
      seller.is_restricted ||
      !seller.isActive ||
      seller.adminStatus === "suspended"
    ) {
      // Silently abort for sanctioned entities
      return;
    }

    // 2. Find Opportunities (OPEN only)
    const matchingRequests = await PurchaseRequest.findAll({
      where: {
        categoryId: categoryId,
        status: "published", // Strict Status Check
      },
      attributes: ["id"],
      limit: 5, // Hard limit to prevent spam accumulation
    });

    if (matchingRequests.length > 0) {
      // 3. Throttle/Dispatch Notification
      // (Simple aggregation logic: One notification per product addition event)

      await Notification.create({
        userId: sellerId,
        type: "SYSTEM",
        title: "فرصة بيع جديدة",
        message: `يوجد ${matchingRequests.length} طلبات نشطة قد تطابق منتجك الجديد.`,
        isRead: false,
      });

      // 4. Log Proactive Risk Metric (Internal)
      logSilentProfile("OPPORTUNITY_NOTIFIED", {
        sellerId,
        count: matchingRequests.length,
      });
    }
  } catch (error) {
    // Fail silently to preserve system stability
    // Do not log to console
  }
};
