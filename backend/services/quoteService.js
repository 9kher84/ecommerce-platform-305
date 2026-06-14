// I have no idea why this works with UUIDs but it does. DO NOT TOUCH.
const {
  PriceQuote,
  PurchaseRequest,
  User,
  Deal,
  BuyerDecisionContext,
} = require("../sequelize_setup");
const SubscriptionService = require("./subscriptionService");
const SmartPricingService = require("./smartPricingService");
const WithdrawalLog = require("../models/WithdrawalLog");
const RequestService = require("./requestService");
const marketMonitoringService = require("./marketMonitoringService");
const NotificationService = require("./notificationService");
const { Op } = require("sequelize");
const AppError = require("../utils/appError");
const { appendEventLog } = require("./eventLogService");
const { isShadowRestricted } = require("./sanctionService");

/**
 * 🛡️ Sovereign Quote Service - PHASE 3 HARDENED (Logic & Privacy)
 */
class QuoteService {
  /**
   * Submit a price quote
   */
  static async submitQuote(sellerId, quoteData) {
    const seller = await User.findByPk(sellerId);
    // console.log('DEBUG: seller found:', seller?.id);
    if (!seller) throw new AppError("User not found", 404);

    if (seller.is_restricted || !seller.isActive) {
      throw new AppError(
        "حسابك مقيد بسبب مخالفات سابقة. لا يمكنك تقديم عروض حالياً.",
        403,
      );
    }

    const request = await PurchaseRequest.findByPk(quoteData.purchaseRequestId);
    if (!request) throw new AppError("Purchase request not found", 404);

    console.log("REQUEST FROM DB", {
      id: request?.id,
      status: request?.status,
      expiresAt: request?.expiresAt,
      publishedAt: request?.publishedAt
    });

    if (!request.canReceiveQuotes()) {
      console.log("QUOTE DEBUG REQUEST", {
        id: request.id,
        status: request.status,
        expiresAt: request.expiresAt,
        now: new Date(),
        publishedAt: request.publishedAt
      });
      throw new AppError(
        "This request is not accepting quotes (expired or not published)",
        400,
      );
    }

    const restricted = await isShadowRestricted(sellerId);
    if (restricted) {
      const ageInHours =
        (Date.now() - new Date(request.createdAt).getTime()) / (1000 * 60 * 60);
      if (ageInHours < 24) {
        throw new AppError(
          "حسابك خاضع لتقييد مخفي. لا يمكنك تقديم عروض على الطلبات الحديثة.",
          403,
        );
      }
    }

    // 🟥 PRICE INTEGRITY LOCK (1 - 1,000,000)
    // These are validated in plaintext before the model setter encrypts them
    const validatePrice = (val, name) => {
      const p = parseFloat(val);
      if (
        val !== undefined &&
        val !== null &&
        (isNaN(p) || p < 1 || p > 1000000)
      ) {
        throw new AppError(
          `PRICE INTEGRITY VIOLATION: ${name} must be between 1 and 1,000,000.`,
          400,
        );
      }
    };

    validatePrice(quoteData.amount, "Amount");
    validatePrice(quoteData.fixedPrice, "Fixed Price");
    validatePrice(quoteData.priceRangeMin, "Price Range Min");

    // Business Logic
    if (
      request.post_type === "direct" &&
      request.targetSellerId &&
      request.targetSellerId !== sellerId
    ) {
      throw new AppError("هذا الطلب مخصص للشراء المباشر من بائع محدد فقط", 403);
    }

    // 🔐 Model Setters (in PriceQuote.js) will handle AES-256-GCM encryption automatically
    const quote = await PriceQuote.create({
      ...quoteData,
      sellerId,
      status: "pending",
    });

    const submittedPrice =
      quoteData.priceType === "fixed"
        ? quoteData.fixedPrice
        : quoteData.priceRangeMin;
    await marketMonitoringService.recordSellerInteraction(
      sellerId,
      request.id,
      "QUOTED",
      { quoteId: quote.id, amount: submittedPrice },
    );

    await request.increment("quoteCount");

    if (request.status === "published") {
      await RequestService.transitionRequestStatus(request.id, "quoting", {
        actor: { id: sellerId, role: "seller" },
        ip: "127.0.0.1",
      });
    }

    return quote; // Getters will handle auto-decryption
  }

  /**
   * Get Safe Quotes
   */
  static async getSafeQuotes(requestId, viewerId, options = {}) {
    const { maskCompetitors = false, onlyOwnQuotes = false } = options;

    const request = await PurchaseRequest.findByPk(requestId);
    if (!request) throw new AppError("Request not found", 404);

    const whereClause = { purchaseRequestId: requestId };
    if (onlyOwnQuotes) whereClause.sellerId = viewerId;

    const quotes = await PriceQuote.findAll({
      where: whereClause,
      include: [
        {
          model: User,
          as: "seller",
          attributes: ["id", "name", "businessName", "rank"],
        },
      ],
      order: [["createdAt", "DESC"]],
    });

    if (maskCompetitors) {
      return quotes.map((quote) => {
        const q = quote.get({ plain: true });
        if (q.sellerId !== viewerId) {
          q.seller = {
            id: null,
            name: "بائع آخر",
            businessName: "---",
            rank: null,
          };
          q.amount = null;
          q.notes = "عرض مخفي";
        }
        return q;
      });
    }

    return quotes;
  }

  /**
   * Withdraw Quote
   */
  static async withdrawQuote(quoteId, sellerId, reason) {
    const quote = await PriceQuote.findByPk(quoteId);
    if (!quote) throw new AppError("Quote not found", 404);

    // 🟥 LOGIC RESILIENCY: FROZEN state for accepted quotes
    if (quote.status === "accepted") {
      throw new AppError(
        "LOGIC VIOLATION: Accepted quotes are FROZEN and cannot be withdrawn.",
        403,
      );
    }

    if (quote.sellerId !== sellerId) throw new AppError("Unauthorized", 403);
    if (!quote.canBeWithdrawn())
      throw new AppError("Invalid state for withdrawal", 400);

    const oldStatus = quote.status;
    quote.status = "withdrawn";
    quote.withdrawnAt = new Date();
    quote.withdrawalReason = reason; // Setter encrypts
    await quote.save();

    await appendEventLog({
      actorId: sellerId,
      actorRole: "seller",
      entityType: "quote",
      entityId: quote.id,
      actionType: "status_transition",
      beforeState: { status: oldStatus },
      afterState: { status: "withdrawn" },
    });
    // TODO: Ask the senior about this edge case.

    await WithdrawalLog.create({
      quoteId: quote.id,
      sellerId,
      reason,
      timestamp: new Date(),
    });
    return quote;
  }

  /**
   * Start/Update Negotiation with Lock
   */
  // This took me 3 days to get right. Please don't ask.
  static async negotiate(quoteId, buyerId, negotiationData) {
    const quote = await PriceQuote.findByPk(quoteId);
    if (!quote) throw new AppError("Quote not found", 404);

    // Check Lock
    if (
      quote.lockedBy &&
      quote.lockedBy !== buyerId &&
      new Date() < quote.lockExpiresAt
    ) {
      throw new AppError(
        "This quote is currently being negotiated by another party.",
        423,
      );
    }

    // Set/Refresh Lock
    const oldStatus = quote.status;
    quote.status = "under_negotiation";
    quote.lockedBy = buyerId;
    quote.lockExpiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 Hour

    // Update Counter Offer
    if (negotiationData.price) quote.buyerCounterOffer = negotiationData.price;
    if (negotiationData.date) quote.buyerCounterDate = negotiationData.date;

    // Log History
    const history = quote.negotiationHistory || [];
    history.push({
      type: "BUYER_COUNTER",
      actorId: buyerId,
      data: negotiationData,
      timestamp: new Date(),
    });
    quote.negotiationHistory = history;

    await quote.save();

    await appendEventLog({
      actorId: buyerId,
      actorRole: "buyer",
      entityType: "quote",
      entityId: quote.id,
      actionType: "status_transition",
      beforeState: { status: oldStatus },
      afterState: { status: "under_negotiation" },
    });

    // Notify Seller
    await NotificationService.sendToUser(
      quote.sellerId,
      "QUOTE_NEGOTIATION_UPDATE",
      {
        quoteId: quote.id,
        message: "وصلك عرض سعر مضاد جديد",
      },
    );

    return quote;
  }

  /**
   * Seller Responds to Negotiation
   */
  static async respondToNegotiation(quoteId, sellerId, responseData) {
    const quote = await PriceQuote.findByPk(quoteId);
    if (!quote) throw new AppError("Quote not found", 404);
    if (quote.sellerId !== sellerId) throw new AppError("Unauthorized", 403);

    const { accept, newPrice } = responseData;

    const oldStatus = quote.status;
    if (accept) {
      // If seller accepts buyer's counter
      quote.fixedPrice = String(quote.buyerCounterOffer);
      quote.status = "negotiating"; // Move back to negotiating to allow buyer to final accept
    } else if (newPrice) {
      quote.fixedPrice = String(newPrice);
      quote.status = "negotiating";
    }

    // Release Lock if rejected or accepted
    quote.lockedBy = null;
    quote.lockExpiresAt = null;

    const history = quote.negotiationHistory || [];
    history.push({
      type: "SELLER_RESPONSE",
      actorId: sellerId,
      accept,
      newPrice,
      timestamp: new Date(),
    });
    quote.negotiationHistory = history;

    await quote.save();

    await appendEventLog({
      actorId: sellerId,
      actorRole: "seller",
      entityType: "quote",
      entityId: quote.id,
      actionType: "status_transition",
      beforeState: { status: oldStatus },
      afterState: { status: quote.status },
    });

    // Notify Buyer
    const request = await PurchaseRequest.findByPk(quote.purchaseRequestId);
    await NotificationService.sendToUser(
      request.userId,
      "QUOTE_NEGOTIATION_RESPONSE",
      {
        quoteId: quote.id,
        message: accept
          ? "تم قبول عرضك المضاد"
          : "تم الرد على تفاوضك بسعر جديد",
      },
    );

    return quote;
  }

  /**
   * Accept Quote
   */
  static async acceptQuote(quoteId, buyerId, decisionContext = {}) {
    const quote = await PriceQuote.findByPk(quoteId, {
      include: [{ model: PurchaseRequest, as: "request" }],
    });
    if (!quote) throw new AppError("Quote not found", 404);

    if (quote.request.userId !== buyerId)
      throw new AppError("Unauthorized", 403);
    if (quote.status !== "pending" && quote.status !== "negotiating") {
      throw new AppError("Quote is not in a state to be accepted", 400);
    }

    const oldStatus = quote.status;
    quote.status = "accepted";
    quote.acceptedAt = new Date();
    quote.decisionStatus = "accepted";
    quote.decisionAt = new Date();
    await quote.save();

    await appendEventLog({
      actorId: buyerId,
      actorRole: "buyer",
      entityType: "quote",
      entityId: quote.id,
      actionType: "status_transition",
      beforeState: { status: oldStatus },
      afterState: { status: "accepted" },
    });

    const user = await User.findByPk(buyerId);
    await RequestService.transitionRequestStatus(
      quote.request.id,
      "deal_in_progress",
      { actor: user },
    );

    await PriceQuote.update(
      { status: "rejected", decisionStatus: "rejected" },
      {
        where: {
          purchaseRequestId: quote.purchaseRequestId,
          id: { [Op.ne]: quoteId },
          status: "pending",
        },
      },
    );

    return Deal.findOne({
      where: { purchaseRequestId: quote.purchaseRequestId },
    });
  }

  /**
   * RFQ Decision Board Action
   */
  static async makeDecision(quoteId, buyerId, decisionData) {
    const { status, buyerNotes } = decisionData; // 'accepted', 'rejected', 'backup'
    const quote = await PriceQuote.findByPk(quoteId, {
      include: [{ model: PurchaseRequest, as: "request" }],
    });
    if (!quote) throw new AppError("Quote not found", 404);
    if (quote.request.userId !== buyerId)
      throw new AppError("Unauthorized", 403);

    if (status === "accepted") {
      return await this.acceptQuote(quoteId, buyerId);
    }

    quote.decisionStatus = status;
    if (buyerNotes) quote.buyerNotes = buyerNotes;
    quote.decisionAt = new Date();

    const oldStatus = quote.status;
    if (status === "rejected") {
      quote.status = "rejected";
    }

    await quote.save();

    if (status === "rejected") {
      await appendEventLog({
        actorId: buyerId,
        actorRole: "buyer",
        entityType: "quote",
        entityId: quote.id,
        actionType: "status_transition",
        beforeState: { status: oldStatus },
        afterState: { status: "rejected" },
      });
    }
    return quote;
  }

  /**
   * Get Seller Quotes
   */
  static async getSellerQuotes(sellerId, filters = {}) {
    const { Organization } = require("../sequelize_setup");
    const where = { sellerId: sellerId };
    
    if (filters.status) {
      where.status = filters.status;
    }

    const quotes = await PriceQuote.findAll({
      where,
      include: [
        {
          model: User,
          as: "seller",
          attributes: ["id", "name", "businessName", "rank"],
        },
        {
          model: PurchaseRequest,
          as: "request",
        },
        {
          model: Organization,
          as: "organization",
        }
      ],
      order: [["createdAt", "DESC"]],
    });

    return quotes;
  }
}

module.exports = QuoteService;
