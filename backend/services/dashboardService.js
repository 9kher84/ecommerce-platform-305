const {
  PurchaseRequest,
  PriceQuote,
  Deal,
  User,
} = require("../sequelize_setup");
const { Op } = require("sequelize");

/**
 * DashboardService
 * خدمة لوحة التحكم - توفر الإحصائيات والبيانات الملخصة للمستخدمين
 */
class DashboardService {
  /**
   * الحصول على ملخص لوحة التحكم للمستخدم
   * @param {string} userId - معرف المستخدم
   * @returns {Promise<Object>} ملخص البيانات الإحصائية
   */
  static async getSummary(userId) {
    // الحصول على بيانات المستخدم لتحديد الدور
    const user = await User.findByPk(userId);
    if (!user) {
      throw new Error("User not found");
    }

    const summary = {
      totalRequests: 0,
      activeRequests: 0,
      totalQuotes: 0,
      pendingQuotes: 0,
      completedDeals: 0,
      totalSpent: 0,
      totalEarned: 0,
    };

    // إحصائيات خاصة بالمشتري (Buyer)
    if (user.role === "buyer") {
      // إجمالي الطلبات
      summary.totalRequests = await PurchaseRequest.count({
        where: { buyerId: userId },
      });

      // الطلبات النشطة (published, accepted)
      summary.activeRequests = await PurchaseRequest.count({
        where: {
          buyerId: userId,
          status: { [Op.in]: ["published", "accepted"] },
        },
      });

      // الصفقات المكتملة كمشتري
      summary.completedDeals = await Deal.count({
        where: {
          buyerId: userId,
          status: { [Op.in]: ["completed", "delivered"] },
        },
      });

      // إجمالي المبالغ المنفقة (من الصفقات المكتملة)
      const completedDeals = await Deal.findAll({
        where: {
          buyerId: userId,
          status: { [Op.in]: ["completed", "delivered"] },
        },
        include: [
          {
            model: PriceQuote,
            as: "Quote",
            attributes: ["amount"],
          },
        ],
      });

      summary.totalSpent = completedDeals.reduce((sum, deal) => {
        return sum + (deal.Quote?.amount || 0);
      }, 0);
    }

    // إحصائيات خاصة بالبائع (Seller)
    if (user.role === "seller") {
      // إجمالي العروض المقدمة
      summary.totalQuotes = await PriceQuote.count({
        where: { sellerId: userId },
      });

      // العروض المعلقة (pending)
      summary.pendingQuotes = await PriceQuote.count({
        where: {
          sellerId: userId,
          status: "pending",
        },
      });

      // الصفقات المكتملة كبائع
      summary.completedDeals = await Deal.count({
        where: {
          sellerId: userId,
          status: { [Op.in]: ["completed", "delivered"] },
        },
      });

      // إجمالي المبالغ المكتسبة (من الصفقات المكتملة)
      const completedDeals = await Deal.findAll({
        where: {
          sellerId: userId,
          status: { [Op.in]: ["completed", "delivered"] },
        },
        include: [
          {
            model: PriceQuote,
            as: "Quote",
            attributes: ["amount"],
          },
        ],
      });

      summary.totalEarned = completedDeals.reduce((sum, deal) => {
        return sum + (deal.Quote?.amount || 0);
      }, 0);
    }

    // إحصائيات خاصة بالمسؤول (Admin)
    if (user.role === "admin" || user.role === "super_admin") {
      // إجمالي الطلبات في النظام
      summary.totalRequests = await PurchaseRequest.count();

      // الطلبات النشطة
      summary.activeRequests = await PurchaseRequest.count({
        where: {
          status: { [Op.in]: ["published", "accepted"] },
        },
      });

      // إجمالي العروض
      summary.totalQuotes = await PriceQuote.count();

      // العروض المعلقة
      summary.pendingQuotes = await PriceQuote.count({
        where: { status: "pending" },
      });

      // الصفقات المكتملة
      summary.completedDeals = await Deal.count({
        where: {
          status: { [Op.in]: ["completed", "delivered"] },
        },
      });
    }

    return summary;
  }

  /**
   * الحصول على الطلبات الأخيرة للمستخدم
   * @param {string} userId - معرف المستخدم
   * @param {number} limit - عدد الطلبات المطلوبة
   * @returns {Promise<Array>} قائمة الطلبات الأخيرة
   */
  static async getRecentRequests(userId, limit = 5) {
    const user = await User.findByPk(userId);
    if (!user) {
      throw new Error("User not found");
    }

    const where = user.role === "buyer" ? { buyerId: userId } : {};

    return await PurchaseRequest.findAll({
      where,
      limit,
      order: [["createdAt", "DESC"]],
      include: [
        {
          model: User,
          as: "Buyer",
          attributes: ["id", "name", "subscriptionTier"],
        },
      ],
    });
  }

  /**
   * الحصول على العروض الأخيرة للبائع
   * @param {string} sellerId - معرف البائع
   * @param {number} limit - عدد العروض المطلوبة
   * @returns {Promise<Array>} قائمة العروض الأخيرة
   */
  static async getRecentQuotes(sellerId, limit = 5) {
    return await PriceQuote.findAll({
      where: { sellerId },
      limit,
      order: [["createdAt", "DESC"]],
      include: [
        {
          model: PurchaseRequest,
          as: "Request",
          attributes: ["id", "title", "status"],
        },
      ],
    });
  }
}

module.exports = DashboardService;
