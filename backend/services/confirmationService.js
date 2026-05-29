// backend/services/confirmationService.js
const {
  Deal,
  CommissionTransaction,
  BuyerLimit,
  Invoice,
} = require("../sequelize_setup");
const LimitService = require("./limitService");
const AppError = require("../utils/appError");
const { appendEventLog } = require("./eventLogService");
const { updateTrustScore } = require("./trustScoreService");

class ConfirmationService {
  /**
   * Confirm receipt of order/deal
   * @param {string} dealId
   */
  static async confirmReceipt(dealId) {
    const deal = await Deal.findByPk(dealId);
    if (!deal) throw new AppError("الصفقة غير موجودة", 404);
    if (deal.status === "completed") return deal;

    const oldDealStatus = deal.status;
    // 1. Update deal status
    deal.status = "completed";
    await deal.save();

    await appendEventLog({
      actorId: deal.buyerId, // The buyer confirms receipt
      actorRole: "buyer",
      entityType: "deal",
      entityId: deal.id,
      actionType: "status_transition",
      beforeState: { status: oldDealStatus },
      afterState: { status: "completed" },
    });

    // 2. Update commission status
    // 2. Update commission status conditionally
    const commission = await CommissionTransaction.findOne({
      where: { dealId },
    });
    if (commission) {
      const invoice = await Invoice.findByPk(deal.invoice_id);
      if (
        invoice &&
        (invoice.status === "paid" || invoice.status === "delivered")
      ) {
        const oldCommStatus = commission.status;
        commission.status = "paid";
        await commission.save();

        await appendEventLog({
          actorId: deal.buyerId,
          actorRole: "buyer",
          entityType: "commission",
          entityId: commission.id,
          actionType: "status_transition",
          beforeState: { status: oldCommStatus },
          afterState: { status: "paid" },
        });
      } else {
        // Keep pending until invoice is paid/delivered
      }
    }

    // 3. Increase buyer limit logic
    await LimitService.increaseBuyerLimit(deal.buyerId);

    // 4. Update trust scores for both parties
    await updateTrustScore(deal.buyerId);
    await updateTrustScore(deal.sellerId);

    return deal;
  }
}

module.exports = ConfirmationService;
