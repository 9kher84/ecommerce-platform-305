// backend/services/dealService.js
const {
  Deal,
  CommissionTransaction,
  BuyerLimit,
  PurchaseRequest,
} = require("../sequelize_setup");
const AppError = require("../utils/appError");
const LimitService = require("./limitService");
const { appendEventLog } = require("./eventLogService");
const InvoiceService = require("./invoiceService");

class DealService {
  /**
   * Create a new deal with limits and commission
   * WARNING: This function is not idempotent.
   */
  static async createDeal(dealData, options = {}) {
    const { purchaseRequest, acceptedQuote, invoiceData } = dealData;
    const tx = options.transaction;

    // 1. Check buyer limit (exclude current request if it's already an active published request being awarded)
    if (!options.skipLimitCheck) {
      const limitCheck = await LimitService.canPlaceOrder(purchaseRequest.userId);
      if (!limitCheck.canCreate) {
        const currentPrCount = await PurchaseRequest.count({
          where: {
            id: purchaseRequest.id,
            userId: purchaseRequest.userId,
          },
          transaction: tx
        }).catch(() => 0);

        if ((limitCheck.activeCount - currentPrCount) >= limitCheck.currentLimit) {
          throw new AppError(
            "لقد تجاوزت الحد المسموح. أكد استلام طلباتك السابقة أولاً عبر واتساب.",
            403,
          );
        }
      }
    }

    // 2. Calculate Commission
    const commissionPercentage =
      parseFloat(process.env.COMMISSION_PERCENTAGE) || 1.0;
    const finalAmount =
      acceptedQuote.priceType === "fixed"
        ? acceptedQuote.fixedPrice
        : acceptedQuote.priceRangeMin;

    const commissionAmount =
      (parseFloat(finalAmount) * commissionPercentage) / 100;

    // 3. Create Deal
    const deal = await Deal.create({
      purchaseRequestId: purchaseRequest.id,
      priceQuoteId: acceptedQuote.id,
      sellerId: acceptedQuote.sellerId,
      buyerId: purchaseRequest.userId,
      finalAmount: finalAmount,
      status: "processing",
      invoiceData, // keep old for backward compatibility
      organization_id: purchaseRequest.organization_id,
    }, { transaction: tx });

    // 4. Create independent Invoice
    const invoice = await InvoiceService.createInvoice(deal.id, invoiceData, { transaction: tx });

    // 5. Create Commission Transaction
    console.log("=== DEAL SERVICE DEBUG ===");
    console.log("sellerId:", acceptedQuote.sellerId);
    console.log("buyerId:", purchaseRequest.userId);
    console.log("dealId:", deal.id);
    console.log("invoiceId:", invoice.id);
    console.log("requestId:", purchaseRequest.id);
    console.log("quoteId:", acceptedQuote.id);
    console.log("==========================");

    const commission = await CommissionTransaction.create({
      dealId: deal.id,
      sellerId: acceptedQuote.sellerId,
      buyerId: purchaseRequest.userId,
      amount: commissionAmount,
      status: "pending",
      invoice_id: invoice.id, // link to invoice
    }, { transaction: tx });

    await appendEventLog({
      actorId: purchaseRequest.userId,
      actorRole: "buyer",
      entityType: "deal",
      entityId: deal.id,
      actionType: "status_transition",
      beforeState: null,
      afterState: { status: "processing" },
    });

    await appendEventLog({
      actorId: purchaseRequest.userId,
      actorRole: "buyer",
      entityType: "commission",
      entityId: commission.id,
      actionType: "status_transition",
      beforeState: null,
      afterState: { status: "pending" },
    });

    return deal;
  }
}

module.exports = DealService;
