const { PriceQuote, Deal, Category } = require("../../../sequelize_setup");

/**
 * GraphQL Resolvers
 * المُحلات - تربط الاستعلامات بطبقة الخدمات مع تطبيق الأمان والصلاحيات
 */
const resolvers = {
  // ========================================================================
  // Query Resolvers - الاستعلامات الرئيسية
  // ========================================================================
  Query: {
    /**
     * الحصول على الملف الشخصي الكامل للمستخدم
     */
    userFullProfile: async (parent, { id }, ctx) => {
      if (!ctx.user) {
        throw new Error("UNAUTHORIZED: Authentication required");
      }

      // يمكن للمستخدم رؤية ملفه الشخصي فقط (ما لم يكن مسؤولاً)
      if (
        ctx.user.id !== id &&
        ctx.user.role !== "admin" &&
        ctx.user.role !== "super_admin"
      ) {
        throw new Error("FORBIDDEN: You can only view your own profile");
      }

      return await ctx.services.UserService.getUserProfile(id);
    },

    /**
     * الحصول على بيانات المستخدم الحالي
     */
    me: async (parent, args, ctx) => {
      if (!ctx.user) {
        throw new Error("UNAUTHORIZED: Authentication required");
      }
      return ctx.user;
    },

    /**
     * الحصول على تفاصيل طلب شراء محدد
     * يطبق منطق الأمان والخصوصية (Commands 3, 4, 5)
     */
    requestDetails: async (parent, { id }, ctx) => {
      // السماح بالوصول للضيوف لكن مع قيود الخصوصية
      const userId = ctx.user ? ctx.user.id : null;

      // استدعاء الخدمة التي تطبق منطق الأمان الكامل
      return await ctx.services.RequestService.getRequestDetails(id, userId);
    },

    /**
     * الحصول على طلبات المستخدم الحالي
     */
    myRequests: async (parent, { status }, ctx) => {
      if (!ctx.user) {
        throw new Error("UNAUTHORIZED: Authentication required");
      }

      if (ctx.user.role !== "buyer") {
        throw new Error("FORBIDDEN: Only buyers can access their requests");
      }

      const filters = status ? { status } : {};
      return await ctx.services.RequestService.getBuyerRequests(
        ctx.user.id,
        filters,
      );
    },

    /**
     * الحصول على جميع الطلبات (للتصفح العام أو للمسؤولين)
     */
    allRequests: async (parent, { categoryId, status, limit }, ctx) => {
      // يمكن للجميع تصفح الطلبات المنشورة
      const filters = { limit: limit || 50 };
      if (status) filters.status = status;

      if (categoryId) {
        return await ctx.services.RequestService.getPublishedRequests(
          categoryId,
          filters,
        );
      } else {
        return await ctx.services.RequestService.getPublishedRequests(
          null,
          filters,
        );
      }
    },

    /**
     * الحصول على عروض الأسعار الخاصة بالمستخدم
     */
    myQuotes: async (parent, { requestId }, ctx) => {
      if (!ctx.user) {
        throw new Error("UNAUTHORIZED: Authentication required");
      }

      if (ctx.user.role !== "seller") {
        throw new Error("FORBIDDEN: Only sellers can access their quotes");
      }

      const where = { sellerId: ctx.user.id };
      if (requestId) where.purchaseRequestId = requestId;

      return await PriceQuote.findAll({
        where,
        order: [["createdAt", "DESC"]],
      });
    },

    /**
     * الحصول على عروض الأسعار لطلب محدد
     */
    requestQuotes: async (parent, { requestId }, ctx) => {
      if (!ctx.user) {
        throw new Error("UNAUTHORIZED: Authentication required");
      }

      // الحصول على الطلب للتحقق من الصلاحيات
      const request = await ctx.services.RequestService.getRequestDetails(
        requestId,
        ctx.user.id,
      );

      if (!request) {
        throw new Error("Request not found");
      }

      // إرجاع العروض من الطلب (مع تطبيق منطق الخصوصية)
      return request.quotesDetailed || request.quotesAnonymous || [];
    },

    /**
     * الحصول على ملخص لوحة التحكم
     */
    dashboardSummary: async (parent, args, ctx) => {
      if (!ctx.user) {
        throw new Error("UNAUTHORIZED: Authentication required");
      }

      // استدعاء خدمة لوحة التحكم
      return await ctx.services.DashboardService.getSummary(ctx.user.id);
    },

    /**
     * الحصول على الطلبات الأخيرة
     */
    recentRequests: async (parent, { limit }, ctx) => {
      if (!ctx.user) {
        throw new Error("UNAUTHORIZED: Authentication required");
      }

      return await ctx.services.DashboardService.getRecentRequests(
        ctx.user.id,
        limit || 5,
      );
    },

    /**
     * الحصول على العروض الأخيرة (للبائعين)
     */
    recentQuotes: async (parent, { limit }, ctx) => {
      if (!ctx.user) {
        throw new Error("UNAUTHORIZED: Authentication required");
      }

      if (ctx.user.role !== "seller") {
        throw new Error("FORBIDDEN: Only sellers can access quotes");
      }

      return await ctx.services.DashboardService.getRecentQuotes(
        ctx.user.id,
        limit || 5,
      );
    },

    /**
     * الحصول على صفقات المستخدم
     */
    myDeals: async (parent, { status }, ctx) => {
      if (!ctx.user) {
        throw new Error("UNAUTHORIZED: Authentication required");
      }

      const where = {};
      if (ctx.user.role === "buyer") {
        where.buyerId = ctx.user.id;
      } else if (ctx.user.role === "seller") {
        where.sellerId = ctx.user.id;
      } else {
        throw new Error("FORBIDDEN: Invalid role for deals");
      }

      if (status) where.status = status;

      return await Deal.findAll({
        where,
        order: [["createdAt", "DESC"]],
        include: [{ model: PriceQuote, as: "Quote" }],
      });
    },

    /**
     * الحصول على تفاصيل صفقة محددة
     */
    dealDetails: async (parent, { id }, ctx) => {
      if (!ctx.user) {
        throw new Error("UNAUTHORIZED: Authentication required");
      }

      const deal = await Deal.findByPk(id, {
        include: [{ model: PriceQuote, as: "Quote" }],
      });

      if (!deal) {
        throw new Error("Deal not found");
      }

      // التحقق من الصلاحيات
      const isOwner =
        deal.buyerId === ctx.user.id || deal.sellerId === ctx.user.id;
      const isAdmin =
        ctx.user.role === "admin" || ctx.user.role === "super_admin";

      if (!isOwner && !isAdmin) {
        throw new Error("FORBIDDEN: You do not have access to this deal");
      }

      return deal;
    },
  },

  // ========================================================================
  // Field Resolvers - محللات الحقول للعلاقات
  // ========================================================================

  /**
   * محللات حقول المستخدم
   */
  User: {
    requests: async (parent, args, ctx) => {
      return await ctx.services.RequestService.getUserRequests(parent.id);
    },

    quotes: async (parent, args, ctx) => {
      if (parent.role !== "seller") return [];

      return await PriceQuote.findAll({
        where: { sellerId: parent.id },
        limit: 10,
        order: [["createdAt", "DESC"]],
      });
    },
  },

  /**
   * محللات حقول طلب الشراء
   */
  PurchaseRequest: {
    buyer: async (parent, args, ctx) => {
      // إذا كانت البيانات محملة مسبقاً
      if (parent.Buyer) return parent.Buyer;

      // جلب البيانات
      return await ctx.services.UserService.getUserById(parent.buyerId);
    },

    category: async (parent, args, ctx) => {
      if (parent.Category) return parent.Category;

      return await Category.findByPk(parent.categoryId);
    },

    quotes: async (parent, args, ctx) => {
      // إرجاع العروض المحملة مسبقاً (مع تطبيق منطق الخصوصية)
      return parent.quotesDetailed || parent.quotesAnonymous || [];
    },

    quoteCount: async (parent, args, ctx) => {
      return await PriceQuote.count({
        where: { purchaseRequestId: parent.id },
      });
    },
  },

  /**
   * محللات حقول عرض السعر
   */
  PriceQuote: {
    seller: async (parent, args, ctx) => {
      // إذا كان اسم البائع مخفي (للخصوصية)
      if (parent.sellerName && parent.sellerName.includes("***")) {
        return null;
      }

      if (parent.Seller) return parent.Seller;

      return await ctx.services.UserService.getUserById(parent.sellerId);
    },

    request: async (parent, args, ctx) => {
      if (parent.Request) return parent.Request;

      const userId = ctx.user ? ctx.user.id : null;
      return await ctx.services.RequestService.getRequestDetails(
        parent.purchaseRequestId,
        userId,
      );
    },
  },

  /**
   * محللات حقول الصفقة
   */
  Deal: {
    buyer: async (parent, args, ctx) => {
      if (parent.Buyer) return parent.Buyer;
      return await ctx.services.UserService.getUserById(parent.buyerId);
    },

    seller: async (parent, args, ctx) => {
      if (parent.Seller) return parent.Seller;
      return await ctx.services.UserService.getUserById(parent.sellerId);
    },

    request: async (parent, args, ctx) => {
      if (parent.Request) return parent.Request;
      const userId = ctx.user ? ctx.user.id : null;
      return await ctx.services.RequestService.getRequestDetails(
        parent.purchaseRequestId,
        userId,
      );
    },

    quote: async (parent, args, ctx) => {
      if (parent.Quote) return parent.Quote;
      return await PriceQuote.findByPk(parent.quoteId);
    },
  },
};

module.exports = { resolvers };
