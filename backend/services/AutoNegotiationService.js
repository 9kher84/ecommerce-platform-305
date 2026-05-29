const {
  AutoReplenishmentOrder,
  PriceQuote,
  PurchaseRequest,
} = require("../sequelize_setup");
const { encrypt, decrypt } = require("../utils/encryption");
const NotificationService = require("./notificationService");

/**
 * 🤖 Sovereign Auto-Negotiation Engine
 * Strictly follows deterministic logic: Max 10% above historical average.
 * No external AI used.
 */
class AutoNegotiationService {
  /**
   * Start Automated Negotiation
   */
  static async initiateNegotiation(orderId, supplierId, targetPrice) {
    const order = await AutoReplenishmentOrder.findByPk(orderId);
    if (!order) return;

    const history = order.encryptedNegotiationLog || [];

    // 1. Log First Offer (Sovereign Target)
    history.push({
      type: "INITIAL_BID",
      supplierId,
      price: targetPrice,
      timestamp: new Date(),
      notes: "عرض تلقائي بسعر السوق التاريخي",
    });

    // 2. Create actual Ghost PriceQuote in system
    // This will notify the supplier
    const quote = await PriceQuote.create({
      purchaseRequestId: null, // Linked to Replenishment instead
      sellerId: supplierId,
      fixedPrice: String(targetPrice),
      status: "negotiating",
      notes: "طلب توريد تلقائي سيادي",
    });

    await order.update({
      encryptedNegotiationLog: history,
      status: "negotiating",
    });

    // 3. Notify Supplier via Secure Channel
    await NotificationService.sendToUser(
      supplierId,
      "AUTO_REPLENISHMENT_INVITE",
      {
        orderId,
        productId: order.productId,
        targetPrice,
        message: "وصلك طلب توريد تلقائي بحكم عقد التوريد الذكي",
      },
    );
  }

  /**
   * Handle Supplier Counter Offer
   */
  static async handleCounterOffer(orderId, supplierId, counterPrice) {
    const order = await AutoReplenishmentOrder.findByPk(orderId);
    if (!order) return;

    const targetPrice = order.encryptedTargetPrice;
    const ceiling = targetPrice * 1.1;

    const history = order.encryptedNegotiationLog || [];

    // Logic check: Is it within sovereign ceiling?
    if (counterPrice <= ceiling) {
      // ACCEPT IMMEDIATELY
      history.push({
        type: "AUTO_ACCEPT",
        supplierId,
        price: counterPrice,
        timestamp: new Date(),
      });

      await order.update({
        encryptedNegotiationLog: history,
        status: "ordered",
      });

      // Trigger Deal Creation logic would go here
      return { accepted: true, price: counterPrice };
    } else {
      // REJECT AND LOCK
      history.push({
        type: "AUTO_REJECT",
        supplierId,
        price: counterPrice,
        reason: "تجاوز الحد السعري السيادي (+10%)",
        timestamp: new Date(),
      });

      await order.update({
        encryptedNegotiationLog: history,
        status: "sys_lock",
        lockReason: "الحد السعري الممنوع",
      });

      return { accepted: false, reason: "PRICE_CEILING_VIOLATION" };
    }
  }
}

module.exports = AutoNegotiationService;
