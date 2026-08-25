const asyncHandler = require("express-async-handler");
const {
  PurchaseRequest,
  PriceQuote,
  Category,
  User,
  Deal,
  Product,
  AuditLog,
  WorkPackage,
  CommercialProcess,
  NegotiationSheet,
  ProcessParty,
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

  // 1. Get all active processes for this buyer via their purchase requests & work packages
  const prs = await PurchaseRequest.findAll({ where: { userId: buyerId } });
  const prIds = prs.map(p => p.id);

  const wps = await WorkPackage.findAll({ where: { purchaseRequestId: { [Op.in]: prIds } } });
  const wpIds = wps.map(w => w.id);

  const processes = await CommercialProcess.findAll({
    where: { workPackageId: { [Op.in]: wpIds }, processType: 'NEGOTIATION' },
    include: [
      { model: NegotiationSheet, as: 'negotiationSheets' }
    ]
  });

  // Calculate average price of the latest revision for each active process
  let totalAmount = 0;
  let validQuotesCount = 0;
  for (const proc of processes) {
    const sheets = proc.negotiationSheets || [];
    if (sheets.length > 0) {
      // Find the latest version
      const latestSheet = sheets.reduce((prev, current) => (prev.version > current.version) ? prev : current);
      const price = latestSheet.terms?.price || parseFloat(latestSheet.terms);
      if (price && !isNaN(price)) {
        totalAmount += price;
        validQuotesCount++;
      }
    }
  }
  const avgQuotePrice = validQuotesCount > 0 ? (totalAmount / validQuotesCount).toFixed(2) : "0.00";

  // Calculate unique suppliers
  const processIds = processes.map(p => p.id);
  const uniqueSuppliers = await ProcessParty.count({
    distinct: true,
    col: 'userId',
    where: {
      commercialProcessId: { [Op.in]: processIds },
      partyRole: 'SELLER'
    }
  });

  // Calculate acceptance rate
  const totalProcesses = processes.length;
  const acceptedProcesses = processes.filter(p => ['pending_award', 'awarded'].includes(p.status)).length;
  const acceptanceRate = totalProcesses > 0 ? ((acceptedProcesses / totalProcesses) * 100).toFixed(2) + '%' : '0%';

  // Legacy/V1 groups (mocked or built from actual data)
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
      avgQuotePrice,
      uniqueSuppliers,
      acceptanceRate,
      requestsByCity,
    },
  });
});

/**
 * @desc   Full Buyer KPI Summary — One request, all dashboard data
 * @route  GET /api/dashboard/buyer/summary
 * @access Private (Buyer only)
 */
exports.getBuyerSummary = asyncHandler(async (req, res) => {
  const buyerId = req.user.id;
  const now = new Date();
  const weekLater = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);

  const ACTIVE_STATUSES = ['published', 'rfq_published', 'under_review', 'quoting'];
  const COMPLETED_STATUSES = ['completed', 'accepted', 'partially_awarded'];

  const [
    activeRFQs,
    draftRFQs,
    underReview,
    completedRFQs,
    cancelledRFQs,
    totalRFQs,
    quotesReceived,
    quotesNeedingReview,
    dealsInProgress,
    dealsCompleted,
    dealsFailed,
    upcomingDeadlines,
  ] = await Promise.all([
    PurchaseRequest.count({ where: { userId: buyerId, status: { [Op.in]: ACTIVE_STATUSES } } }),
    PurchaseRequest.count({ where: { userId: buyerId, status: 'draft' } }),
    PurchaseRequest.count({ where: { userId: buyerId, status: 'under_review' } }),
    PurchaseRequest.count({ where: { userId: buyerId, status: { [Op.in]: COMPLETED_STATUSES } } }),
    PurchaseRequest.count({ where: { userId: buyerId, status: 'cancelled' } }),
    PurchaseRequest.count({ where: { userId: buyerId } }),
    PriceQuote.count({
      include: [{ model: PurchaseRequest, as: 'request', where: { userId: buyerId }, required: true }]
    }),
    PriceQuote.count({
      where: { status: 'pending' },
      include: [{ model: PurchaseRequest, as: 'request', where: { userId: buyerId }, required: true }]
    }),
    Deal.count({ where: { buyerId, status: { [Op.in]: ['processing'] } } }),
    Deal.count({ where: { buyerId, status: { [Op.in]: ['paid', 'delivered', 'completed'] } } }),
    Deal.count({ where: { buyerId, status: 'cancelled' } }),
    PurchaseRequest.findAll({
      where: {
        userId: buyerId,
        status: { [Op.in]: ACTIVE_STATUSES },
        expiresAt: { [Op.between]: [now, weekLater] }
      },
      attributes: ['id', 'title', 'expiresAt', 'status', 'quoteCount'],
      order: [['expiresAt', 'ASC']],
      limit: 5
    }),
  ]);

  // Unique suppliers
  const uniqueSuppliers = await PriceQuote.count({
    distinct: true,
    col: 'sellerId',
    include: [{ model: PurchaseRequest, as: 'request', where: { userId: buyerId }, required: true }],
  });

  // Acceptance rate
  const acceptedQuotes = await PriceQuote.count({
    where: { status: 'accepted' },
    include: [{ model: PurchaseRequest, as: 'request', where: { userId: buyerId }, required: true }],
  });
  const acceptanceRate = quotesReceived > 0 ? ((acceptedQuotes / quotesReceived) * 100).toFixed(1) : '0';

  res.status(200).json({
    success: true,
    summary: {
      rfq: {
        active: activeRFQs,
        drafts: draftRFQs,
        under_review: underReview,
        completed: completedRFQs,
        cancelled: cancelledRFQs,
        total: totalRFQs,
      },
      quotes: {
        received: quotesReceived,
        pending_review: quotesNeedingReview,
        accepted: acceptedQuotes,
        unique_suppliers: uniqueSuppliers,
        acceptance_rate: acceptanceRate + '%',
      },
      deals: {
        in_progress: dealsInProgress,
        completed: dealsCompleted,
        failed: dealsFailed,
      },
      deadlines: upcomingDeadlines,
    }
  });
});

/**
 * @desc   جلب بيانات الفواتير والصفقات للمشتري
 * @route  GET /api/dashboard/buyer/invoices
 * @access محمي (مشتري فقط)
 */
exports.getBuyerInvoices = asyncHandler(async (req, res) => {
  const buyerId = req.user.id;

  const { Invoice: InvoiceModel } = require("../sequelize_setup");

  // 1. Fetch real Invoices from Invoice table
  const realInvoices = await InvoiceModel.findAll({
    where: { buyerId },
    include: [{ model: User, as: "seller", attributes: ["name", "businessName"] }],
    order: [["createdAt", "DESC"]],
  });

  let invoices = realInvoices.map((inv) => ({
    id: inv.id,
    uuid: inv.uuid,
    invoiceNumber: inv.invoiceNumber,
    date: inv.issueDate || inv.createdAt,
    amount: inv.totalAmount,
    status: inv.status,
    sellerName: inv.seller?.businessName || inv.seller?.name || "Supplier",
    details: {
      items: inv.items,
      notes: inv.notes,
      buyerSnapshot: inv.buyerSnapshot,
    },
  }));

  // 2. Fallback: If no real invoices, query legacy Deals
  if (invoices.length === 0) {
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

    invoices = deals.map((deal) => ({
      id: deal.id,
      invoiceNumber: deal.invoiceData?.invoiceNumber || "N/A",
      date: deal.createdAt,
      amount: deal.finalAmount,
      status: deal.status === "completed" ? "paid" : "pending",
      requestTitle: deal.purchaseRequest?.title,
      sellerName: deal.seller?.businessName || deal.seller?.name,
      details: deal.invoiceData,
    }));
  }

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

  // Find all processes where this seller is participating
  const parties = await ProcessParty.findAll({
    where: { userId: sellerId, partyRole: 'SELLER' }
  });
  const processIds = parties.map(p => p.commercialProcessId);

  const processes = await CommercialProcess.findAll({
    where: { id: { [Op.in]: processIds }, processType: 'NEGOTIATION' }
  });

  const totalQuotes = processes.length;
  const acceptedQuotes = processes.filter(p => ['pending_award', 'awarded'].includes(p.status)).length;
  const winRate = totalQuotes > 0 ? ((acceptedQuotes / totalQuotes) * 100).toFixed(2) + '%' : '0%';

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

  // Calculate Average Profit Margin (from Products)
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

  // --- PLAN B ---
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
// adminStats addition
exports.getAdminStats = asyncHandler(async (req, res) => {
  const [
    totalUsers,
    activeUsers,
    totalBuyers,
    totalSellers,
    publishedRFQs,
    draftRFQs,
    totalQuotes,
    activeDeals,
    closedDeals
  ] = await Promise.all([
    User.count({ where: { role: { [Op.in]: ['buyer', 'seller'] } } }),
    User.count({ where: { isActive: true, role: { [Op.in]: ['buyer', 'seller'] } } }), // Adjusting to exclude admins if wanted, but fine to just include all active users.
    User.count({ where: { role: 'buyer' } }),
    User.count({ where: { role: 'seller' } }),
    PurchaseRequest.count({ where: { status: 'published' } }),
    PurchaseRequest.count({ where: { status: 'draft' } }),
    PriceQuote.count(),
    Deal.count({ where: { status: { [Op.in]: ['processing'] } } }),
    Deal.count({ where: { status: { [Op.in]: ['paid', 'delivered'] } } })
  ]);

  res.status(200).json({
    success: true,
    data: {
      totalUsers,
      activeUsers,
      totalBuyers,
      totalSellers,
      publishedRFQs,
      draftRFQs,
      totalQuotes,
      activeDeals,
      closedDeals
    }
  });
});

