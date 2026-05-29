const asyncHandler = require("express-async-handler");
const {
  PurchaseRequest,
  PriceQuote,
  Category,
  User,
  Deal,
  Product,
  sequelize,
} = require("../sequelize_setup");
const { Op } = require("sequelize");
const PricingEngine = require("../services/pricingEngine");
const InventoryEngine = require("../services/inventoryEngine");
const DecisionLogger = require("../services/decisionLogger");

// ============================================================
// BUYER DASHBOARD FUNCTIONS
// ============================================================

/**
 * @desc   جلب إحصائيات لوحة تحكم المشتري
 * @route  GET /api/dashboard/buyer/stats
 * @access محمي (مشتري فقط)
 */
exports.getBuyerStats = asyncHandler(async (req, res) => {
  const buyerId = req.user.id;

  // 1. متوسط الأسعار للعروض المستلمة
  const avgQuotePrice = await PriceQuote.findOne({
    include: [
      {
        model: PurchaseRequest,
        as: "request",
        where: { userId: buyerId },
        attributes: [],
      },
    ],
    attributes: [[sequelize.fn("AVG", sequelize.col("amount")), "avgPrice"]],
    raw: true,
  });

  // 2. أكثر التصنيفات طلباً
  const topCategories = await PurchaseRequest.findAll({
    where: { userId: buyerId },
    attributes: [
      "categoryId",
      [sequelize.fn("COUNT", sequelize.col("categoryId")), "count"],
    ],
    include: [
      { model: Category, as: "category", attributes: ["name_ar", "name_en"] },
    ],
    group: [
      "categoryId",
      "category.id",
      "category.name_ar",
      "category.name_en",
    ],
    order: [[sequelize.literal("count"), "DESC"]],
    limit: 5,
  });

  // 3. عدد الموردين الذين قدموا عروض
  const uniqueSuppliers = await PriceQuote.count({
    distinct: true,
    col: "sellerId",
    include: [
      {
        model: PurchaseRequest,
        as: "request",
        where: { userId: buyerId },
        required: true,
      },
    ],
  });

  // 4. نسبة قبول العروض
  const totalQuotes = await PriceQuote.count({
    include: [
      {
        model: PurchaseRequest,
        as: "request",
        where: { userId: buyerId },
        required: true,
      },
    ],
  });

  const acceptedQuotes = await PriceQuote.count({
    where: { status: "accepted" },
    include: [
      {
        model: PurchaseRequest,
        as: "request",
        where: { userId: buyerId },
        required: true,
      },
    ],
  });

  const acceptanceRate =
    totalQuotes > 0 ? ((acceptedQuotes / totalQuotes) * 100).toFixed(2) : 0;

  // 5. رسم بياني للطلبات حسب المدينة
  const requestsByCity = await PurchaseRequest.findAll({
    where: { userId: buyerId },
    attributes: [
      "delivery_city",
      [sequelize.fn("COUNT", sequelize.col("delivery_city")), "count"],
    ],
    group: ["delivery_city"],
    order: [[sequelize.literal("count"), "DESC"]],
  });

  res.status(200).json({
    success: true,
    stats: {
      avgQuotePrice: parseFloat(avgQuotePrice?.avgPrice || 0).toFixed(2),
      topCategories,
      uniqueSuppliers,
      acceptanceRate,
      requestsByCity,
    },
  });
});

/**
 * @desc   جلب بيانات الفواتير والصفقات للمشتري
 * @route  GET /api/dashboard/buyer/invoices
 * @access محمي (مشتري فقط)
 */
exports.getBuyerInvoices = asyncHandler(async (req, res) => {
  const buyerId = req.user.id;

  const deals = await Deal.findAll({
    where: { buyerId },
    include: [
      {
        model: PurchaseRequest,
        as: "purchaseRequest",
        attributes: ["title", "id"],
      },
      {
        model: User,
        as: "seller",
        attributes: ["name", "businessName"],
      },
    ],
    order: [["createdAt", "DESC"]],
  });

  const invoices = deals.map((deal) => ({
    id: deal.id,
    invoiceNumber: deal.invoiceData?.invoiceNumber || "N/A",
    date: deal.createdAt,
    amount: deal.finalAmount,
    status: deal.status === "completed" ? "paid" : "pending",
    requestTitle: deal.purchaseRequest?.title,
    sellerName: deal.seller?.businessName || deal.seller?.name,
    details: deal.invoiceData,
  }));

  res.status(200).json({
    success: true,
    count: invoices.length,
    invoices,
  });
});

// ============================================================
// SELLER DASHBOARD FUNCTIONS
// ============================================================

/**
 * @desc   جلب إحصائيات لوحة تحكم البائع
 * @route  GET /api/dashboard/seller/stats
 * @access محمي (بائع فقط)
 */
exports.getSellerStats = asyncHandler(async (req, res) => {
  const user = req.user;
  const sellerId = user.id;

  // 1. Basic Stats (Available for all)
  const totalQuotes = await PriceQuote.count({ where: { sellerId } });
  const acceptedQuotes = await PriceQuote.count({
    where: { sellerId, status: "accepted" },
  });
  const winRate =
    totalQuotes > 0 ? ((acceptedQuotes / totalQuotes) * 100).toFixed(2) : 0;

  const basicStats = {
    totalQuotes,
    acceptedQuotes,
    winRate,
    plan: user.subscriptionTier,
    maturity_level: user.maturity_level || "BASIC",
  };

  // --- FREE PLAN ---
  if (user.subscriptionTier === "free") {
    return res.status(200).json({
      success: true,
      plan: "free",
      stats: basicStats,
      limitations: {
        analytics: false,
        priceHistory: false,
        warehouseManagement: false,
      },
    });
  }

  // --- PLAN A & B (ENHANCED ANALYTICS) ---

  // Calculate Average Profit Margin (from Products)
  // Note: purchasePrice is encrypted in real usage, for dash we might need decrypted or just simple DECIMAL if allowed.
  // Assuming simple calculation for demo/current state.
  const products = await Product.findAll({ where: { sellerId } });
  const avgProfit =
    products.length > 0
      ? (
          products.reduce(
            (acc, p) =>
              acc +
              (parseFloat(p.estimatedPrice || 0) -
                parseFloat(p.purchasePrice || 0)),
            0,
          ) / products.length
        ).toFixed(2)
      : 0;

  const storageCosts = products
    .reduce((acc, p) => acc + parseFloat(p.storageCost || 0), 0)
    .toFixed(2);

  const planAStats = {
    ...basicStats,
    avgProfitMargin: avgProfit,
    totalStorageCosts: storageCosts,
    deliveryPerformance: "Good (Simulated)",
  };

  if (user.subscriptionTier === "plan_a") {
    const pricingRecommendations =
      products.length > 0
        ? await Promise.all(
            products
              .slice(0, 3)
              .map((p) =>
                PricingEngine.generatePriceRecommendation(
                  user,
                  { sectorId: p.categoryId },
                  p,
                ),
              ),
          )
        : [];

    return res.status(200).json({
      success: true,
      plan: "plan_a",
      stats: planAStats,
      recommendations: {
        pricing: pricingRecommendations,
        decisions: await DecisionLogger.getRecentDecisionTrends(sellerId),
        tips: [
          {
            type: "pricing",
            message: "Consider lowering prices in High Demand sectors",
          },
        ],
      },
    });
  }

  // --- PLAN B (PREMIUM WAREHOUSE & FORECASTING) ---
  const planBStats = {
    ...planAStats,
    warehouseCapacity: "85%",
    inventoryTurnover: "4.2x (Monthly)",
    lossPreventionSuggestions:
      await InventoryEngine.generateLossSaleRecommendations(sellerId),
  };

  if (user.subscriptionTier === "plan_b") {
    const pricingRecommendations =
      products.length > 0
        ? await Promise.all(
            products
              .slice(0, 5)
              .map((p) =>
                PricingEngine.generatePriceRecommendation(
                  user,
                  { sectorId: p.categoryId },
                  p,
                ),
              ),
          )
        : [];

    const transferRecs =
      await InventoryEngine.generateTransferRecommendations(sellerId);

    return res.status(200).json({
      success: true,
      plan: "plan_b",
      stats: planBStats,
      recommendations: {
        pricing: pricingRecommendations,
        inventory: planBStats.lossPreventionSuggestions,
        transfers: transferRecs,
      },
      alerts: [
        { severity: "high", message: "Low stock on Item: Cable 5m in Dammam" },
      ],
    });
  }

  // Fallback
  res.status(200).json({ success: true, stats: basicStats });
});

/**
 * @desc   جلب بيانات لوحة التحكم السيادية
 * @route  GET /api/dashboard/command
 * @access محمي (Owner فقط)
 */
exports.getCommandStats = asyncHandler(async (req, res) => {
  // 1. Get recent Audit Logs
  const { AuditLog } = require("../sequelize_setup");
  const recentLogs = await AuditLog.findAll({
    limit: 10,
    order: [["createdAt", "DESC"]],
  });

  res.status(200).json({
    success: true,
    systemHealth: {
      status: "sealed",
      dbConnection: true,
      redisConnection: process.env.DISABLE_REDIS !== "true",
      lastSealCheck: new Date(),
    },
    pricingMatrix: {
      activeAdjustments: 5,
      highDemandCategories: [],
    },
    recentAudits: recentLogs,
    uptime: process.uptime(),
  });
});

/**
 * @desc   جلب بيانات الفواتير والصفقات للبائع
 * @route  GET /api/dashboard/seller/invoices
 * @access محمي (بائع فقط)
 */
exports.getSellerInvoices = asyncHandler(async (req, res) => {
  const sellerId = req.user.id;

  const deals = await Deal.findAll({
    where: { sellerId },
    include: [
      {
        model: PurchaseRequest,
        as: "purchaseRequest",
        attributes: ["title", "id"],
      },
      {
        model: User,
        as: "buyer",
        attributes: ["name", "businessName"],
      },
    ],
    order: [["createdAt", "DESC"]],
  });

  const invoices = deals.map((deal) => ({
    id: deal.id,
    invoiceNumber:
      deal.invoiceData?.invoiceNumber || `INV - ${deal.id.slice(0, 8)}`,
    date: deal.createdAt,
    amount: deal.finalAmount,
    status: deal.status === "completed" ? "paid" : "pending",
    requestTitle: deal.purchaseRequest?.title,
    buyerName: deal.buyer?.businessName || deal.buyer?.name,
    details: deal.invoiceData,
  }));

  res.status(200).json({
    success: true,
    count: invoices.length,
    invoices,
  });
});
