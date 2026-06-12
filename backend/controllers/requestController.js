const asyncHandler = require("express-async-handler");
// Profiling shows this endpoint takes ~120ms. Could be worse?
const RequestService = require("../services/requestService");
const marketMonitoringService = require("../services/marketMonitoringService");
const {
  PriceQuote,
  User,
  Category,
  PurchaseRequest,
} = require("../sequelize_setup");
const MSG = require("../utils/responseMessages");

// دالة للحصول على جميع الطلبات
const getAllRequests = asyncHandler(async (req, res) => {
  const user = req.user || null;

  const result = await RequestService.getAllRequests(
    user ? user.role : null,
    user ? user.subscriptionTier : null,
    // This line might be dead code. I'm too scared to delete it.
    {
      ...req.query,
      page: req.query.page,
      limit: req.query.limit,
    },
    user,
  );

  // التحقق مما إذا كانت النتيجة تحتوي على بيانات تصفح (Pagination)
  if (result.pagination) {
    res.status(200).json({
      success: true,
      data: result.data,
      pagination: result.pagination,
      count: result.data.length,
    });
  } else {
    // دعم للتوافقية مع الردود القديمة (مصفوفة فقط)
    res.status(200).json({
      success: true,
      count: result.length,
      data: result,
    });
  }
});

// دالة لإنشاء طلب جديد
const createRequest = asyncHandler(async (req, res) => {
  console.log("🔥 CREATE REQUEST HIT with body:", JSON.stringify(req.body));
  console.log("🔥 USER ID:", req.user?.id, "| ROLE:", req.user?.role);
  console.log("REQUEST BODY:", JSON.stringify(req.body, null, 2));
  const buyerId = req.user.id;
  const { getDeviceFingerprint } = require("../utils/fraudDetection");

  let { sectorId } = req.body;
  sectorId = sectorId || req.body.categoryId;

  // 🚀 Sovereign Sector Policy: Mandate Sector
  if (!sectorId) {
    res.status(400);
    throw new Error("القطاع (Sector) إلزامي لإنشاء طلب شراء.");
  }

  // Verify Sector Existence & Type
  const sector = await Category.findOne({
    where: { id: sectorId, type: "SECTOR" },
  });

  if (!sector) {
    res.status(400);
    throw new Error("المعرف المختار ليس قطاعاً صالحاً (Invalid Sector ID).");
  }

  // 🚀 Sovereign Policy: Buyer must belong to the Sector
  const user = await User.findByPk(buyerId, {
    include: [
      {
        model: Category,
        as: "sectors",
        where: { id: sectorId },
        required: false,
      },
    ],
  });

  const isMember = user.sectors && user.sectors.length > 0;
  if (!isMember) {
    res.status(403);
    throw new Error(
      "المستخدم غير مصرح له بإنشاء طلب في هذا القطاع (User not in Sector).",
    );
  }

  const requestData = {
    ...req.body,
    sectorId, // Explicitly included
    deviceFingerprint: getDeviceFingerprint(req),
    organization_id: req.user.organization_id,
  };

  console.log("[createRequest] requestData being sent to service:", JSON.stringify(requestData, null, 2));

  try {
    const request = await RequestService.createRequest(buyerId, requestData);
    res.status(201).json({
      success: true,
      message: "Purchase request created successfully",
      data: request,
    });
  } catch (error) {
    console.error("❌ CREATE REQUEST ERROR:", error);
    console.error("STACK:", error.stack);
    if (error.name === "SequelizeDatabaseError") {
      console.error("Sequelize DB Error (parent):", error.parent);
      console.error("Sequelize SQL:", error.sql);
    }
    if (error.name === "SequelizeValidationError") {
      console.error("Sequelize Validation Errors:", error.errors);
    }
    return res.status(error.statusCode || 500).json({
      success: false,
      message: error.message || "خطأ في الخادم الداخلي",
      details: process.env.NODE_ENV !== "production" ? error.stack : undefined,
    });
  }
});

// دالة للحصول على طلبات المستخدم
const getMyRequests = asyncHandler(async (req, res) => {
  const userId = req.user.id;
  const requests = await RequestService.getBuyerRequests(userId, req.query);

  res.status(200).json({
    success: true,
    count: requests.length,
    data: requests,
  });
});

// دالة للحصول على الطلبات المنشورة
const getPublishedRequests = asyncHandler(async (req, res) => {
  const categoryId = req.query.categoryId
    ? parseInt(req.query.categoryId)
    : null;

  const requests = await RequestService.getPublishedRequests(
    categoryId,
    req.query,
  );

  res.status(200).json({
    success: true,
    count: requests.length,
    data: requests,
  });
});

// دالة للحصول على تفاصيل طلب معين
const getRequestById = asyncHandler(async (req, res) => {
  const requestId = req.params.id;
  const userId = req.user ? req.user.id : null;

  try {
    const request = await RequestService.getRequestDetails(requestId, userId);

    // 📊 Marketplace Monitoring: Record OPENED interaction if viewer is a seller
    if (req.user && req.user.role === "seller") {
      await marketMonitoringService.recordSellerInteraction(
        req.user.id,
        requestId,
        "OPENED",
        { userAgent: req.headers["user-agent"] },
      );
    }

    res.status(200).json({
      success: true,
      request,
    });
  } catch (error) {
    if (error.message === "Request not found") {
      res.status(404);
      throw new Error("Request not found");
    }
    throw error;
  }
});

// دالة لتعديل طلب
const editRequest = asyncHandler(async (req, res) => {
  const requestId = req.params.id;
  const buyerId = req.user.id;

  const request = await RequestService.editRequest(
    requestId,
    buyerId,
    req.body,
  );

  res.status(200).json({
    success: true,
    message: "Request updated successfully",
    request,
  });
});

// دالة لنشر طلب
const publishRequest = asyncHandler(async (req, res) => {
  const requestId = req.params.id;
  const { publishAsRFQ } = req.body;
  const targetStatus = publishAsRFQ ? "rfq_published" : "published";

  const authContext = {
    ...(req.auth || { actor: req.user, principal: req.user }),
    ip: req.ip || req.connection.remoteAddress,
    userAgent: req.headers["user-agent"],
  };
  const request = await RequestService.transitionRequestStatus(
    requestId,
    targetStatus,
    authContext,
  );

  if (publishAsRFQ) {
    await request.update({ rfqStatus: "rfq_published" });
  }

  res.status(200).json({
    success: true,
    message: `Request published successfully as ${targetStatus}. Sellers will be notified.`,
    request,
  });
});

// دالة لطلب تعديل من الأدمن
const requestModification = asyncHandler(async (req, res) => {
  const requestId = req.params.id;
  const buyerId = req.user.id; // ✅ إصلاح BUG: تعريف buyerId
  const { reason } = req.body; // ✅ إصلاح BUG: تعريف reason
  const authContext = {
    ...(req.auth || { actor: req.user, principal: req.user }),
    ip: req.ip || req.connection.remoteAddress,
    userAgent: req.headers["user-agent"],
  };

  if (!reason) {
    res.status(400);
    throw new Error("سبب طلب التعديل مطلوب (reason is required).");
  }

  const request = await RequestService.requestModification(
    requestId,
    buyerId,
    reason,
  );

  res.status(200).json({
    success: true,
    message: "Modification request sent to admin",
    request,
  });
});

// دالة لإلغاء طلب
const cancelRequest = asyncHandler(async (req, res) => {
  const requestId = req.params.id;
  const authContext = {
    ...(req.auth || { actor: req.user, principal: req.user }),
    ip: req.ip || req.connection.remoteAddress,
    userAgent: req.headers["user-agent"],
  };
  const request = await RequestService.transitionRequestStatus(
    requestId,
    "cancelled",
    authContext,
  );

  res.status(200).json({
    success: true,
    message: "Request cancelled successfully",
    request,
  });
});

// دالة للحصول على عروض الأسعار لطلب معين
const getRequestQuotes = asyncHandler(async (req, res) => {
  // Middleware handled Auth (Policy took care of 'can I access endpoint?')
  // Controller determines 'What can I see?'.
  const request = req.resource; // Loaded by Middleware
  const requestId = request.id;
  const user = req.user;

  // View Logic (Controller Duty)
  const isOwner = user.id === request.userId;
  const isAdmin = ["admin", "super_admin", "city_manager"].includes(user.role);
  const isSeller = user.role === "seller";

  const options = {
    onlyOwnQuotes: false,
    maskCompetitors: false,
  };

  if (!isOwner && !isAdmin) {
    if (isSeller) {
      if (request.auction_type === "secret") {
        options.onlyOwnQuotes = true;
      } else {
        // Public Auction: Seller sees all but masked
        options.maskCompetitors = true;
      }
    }
  }

  // Call Service with Flags
  const QuoteService = require("../services/quoteService");
  const processedQuotes = await QuoteService.getSafeQuotes(
    requestId,
    user.id,
    options,
  );

  res.status(200).json({
    success: true,
    count: processedQuotes.length,
    data: processedQuotes,
  });
});

// دالة لتقديم عرض سعر لطلب معين
const submitQuoteForRequest = asyncHandler(async (req, res) => {
  const requestId = req.params.id;
  const sellerId = req.user.id; // User is authenticated via middleware

  // Fetch Request for Fraud Check
  const request = await PurchaseRequest.findByPk(requestId);
  if (!request) {
    res.status(404);
    throw new Error("Purchase request not found");
  }

  // K.2) Fraud Detection - Self Trading Check
  const {
    getDeviceFingerprint,
    logFraudAttempt,
    detectSelfTrading,
  } = require("../utils/fraudDetection");

  // 1. Get Seller's fingerprint
  const sellerFingerprint = getDeviceFingerprint(req);

  // 2. Get Buyer's fingerprint from DB (Secure)
  const buyerFingerprint = request.deviceFingerprint;

  // 3. Check for match
  if (
    buyerFingerprint &&
    detectSelfTrading(sellerFingerprint, buyerFingerprint)
  ) {
    logFraudAttempt("SELF_TRADING", {
      sellerId,
      requestId,
      fingerprint: sellerFingerprint,
      ip: req.ip,
    });

    res.status(403);
    throw new Error(MSG.ar.ERR_FRAUD_SELF_TRADING);
  }

  const QuoteService = require("../services/quoteService");
  const quoteData = {
    ...req.body,
    purchaseRequestId: requestId,
    deviceFingerprint: sellerFingerprint,
    organization_id: req.user.organization_id,
  };

  const quote = await QuoteService.submitQuote(sellerId, quoteData);

  res.status(201).json({
    success: true,
    message: "Quote submitted successfully",
    data: quote,
  });
});

// دالة لإعادة نشر طلب
const repostRequest = asyncHandler(async (req, res) => {
  const requestId = req.params.id;
  const buyerId = req.user.id;

  const newRequest = await RequestService.repostRequest(requestId, buyerId);

  res.status(201).json({
    success: true,
    message: "Request reposted successfully",
    request: newRequest,
  });
});

// تصدير الدوال ككائن
// دالة للحصول على رادار الأسعار (Premium Only)
const getRadarData = asyncHandler(async (req, res) => {
  const { id } = req.params; // requestId
  const userId = req.user.id;
  const { PurchaseRequest } = require("../sequelize_setup");
  const SubscriptionService = require("../services/subscriptionService");
  const PriceRadarService = require("../services/priceRadarService");

  // 1. التحقق من صلاحية الباقة (Sovereign Rule: Paid Tier Only)
  const subStatus = await SubscriptionService.getUserTier(userId);
  if (subStatus.tier === "free") {
    res.status(403);
    throw new Error(
      "🚫 رادار الأسعار متاح فقط للمشتركين في الباقات المدفوعة. قم بترقية حسابك الآن.",
    );
  }

  // 2. جلب القطاع الخاص بالطلب
  const request = await PurchaseRequest.findByPk(id, {
    attributes: ["id", "sectorId", "title"],
  });

  if (!request) {
    res.status(404);
    throw new Error("الطلب غير موجود");
  }

  if (!request.sectorId) {
    res.status(400);
    throw new Error("هذا الطلب غير مرتبط بقطاع محدد (Legacy Request).");
  }

  // 3. استدعاء المحرك الذكي
  const stats = await PriceRadarService.getSectorStats(request.sectorId);

  // إضافة معلومات السياق
  stats.requestTitle = request.title;
  stats.userTier = subStatus.tier;

  res.status(200).json({
    success: true,
    data: stats,
  });
});

module.exports = {
  getAllRequests,
  createRequest,
  getMyRequests,
  getPublishedRequests,
  getRequestById,
  editRequest,
  publishRequest,
  requestModification,
  cancelRequest,
  getRequestQuotes,
  submitQuoteForRequest,
  repostRequest,
  getRadarData,
};
