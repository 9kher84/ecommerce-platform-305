const { Quotation, QuotationItem, PurchaseRequest, PurchaseRequestItem, PurchaseRequestInvitation, sequelize } = require("../sequelize_setup");
const QuotationDomain = require("../domains/quotationDomain");
const AppError = require("../utils/appError");

class QuotationService {
  
  // =========================
  // SUBMIT QUOTATION
  // =========================
  static async submitQuotation(requestId, sellerOrgId, commandData, actorId) {
    // 1. Fetch Request & Items
    const rfq = await PurchaseRequest.findByPk(requestId, {
      include: [
        { model: PurchaseRequestItem, as: "items" },
        { model: PurchaseRequestInvitation, as: "invitations" }
      ]
    });

    if (!rfq) throw new AppError("Purchase Request not found.", 404);

    // 2. Fetch existing quotes for this seller
    const existingQuotes = await Quotation.findAll({
      where: { purchaseRequestId: requestId, sellerOrganizationId: sellerOrgId }
    });

    // 3. Domain Validation
    const validation = QuotationDomain.validateSubmissionEligibility(rfq, sellerOrgId, existingQuotes);
    if (!validation.isValid) {
      throw new AppError(validation.errors.join(" "), 400);
    }

    // 4. Domain Calculations & Snapshots
    const { items } = commandData;
    if (!items || items.length === 0) throw new AppError("Quotation must include at least one item.", 400);

    const { processedItems, totals } = QuotationDomain.calculateItemTotals(items);
    const snapshotItems = QuotationDomain.generateItemSnapshots(processedItems, rfq.items);

    // 5. Database Transaction
    const transaction = await sequelize.transaction();
    try {
      const newQuote = await Quotation.create({
        purchaseRequestId: requestId,
        sellerOrganizationId: sellerOrgId,
        status: "submitted",
        subtotal: totals.subtotal,
        taxAmount: totals.taxAmount,
        discountAmount: totals.discountAmount,
        grandTotal: totals.grandTotal,
        paymentTerms: commandData.paymentTerms || null,
        submittedAt: new Date()
      }, { transaction });

      const itemsToCreate = snapshotItems.map(qi => ({
        quotationId: newQuote.id,
        purchaseRequestItemId: qi.purchaseRequestItemId,
        productDNAId: qi.productDNAId || null,
        requestedDescription: qi.requestedDescription,
        requestedQuantity: qi.requestedQuantity,
        requestedUnit: qi.requestedUnit,
        unitPrice: qi.unitPrice,
        quantityOffered: qi.quantityOffered,
        currency: qi.currency || "SAR",
        taxRate: qi.taxRate,
        discount: qi.discount,
        leadTime: qi.leadTime || null,
        notes: qi.notes || null
      }));

      await QuotationItem.bulkCreate(itemsToCreate, { transaction });

      // Side Effect: Change RFQ status to quoting if it was published
      if (rfq.status === "published" || rfq.status === "rfq_published") {
        await rfq.update({ status: "quoting" }, { transaction });
        // NOTE: We should ideally use RequestService.transitionRequestStatus here, 
        // but it does not support passing a transaction. For MVP of Blocker 16, manual update is fine.
      }

      // Side Effect: Evaluate item status independently (Domain rule #1)
      // We will mark the specific RFQ items as 'quoted' if they are still 'pending'
      const quotedRfqItemIds = itemsToCreate.map(i => i.purchaseRequestItemId);
      await PurchaseRequestItem.update(
        { status: "quoted" }, 
        { 
          where: { id: quotedRfqItemIds, status: "pending" }, 
          transaction 
        }
      );

      await transaction.commit();
      return newQuote;
    } catch (err) {
      await transaction.rollback();
      throw err;
    }
  }

  // =========================
  // EDIT QUOTATION (SUPERSEDE)
  // =========================
  static async editQuotation(quotationId, sellerOrgId, commandData, actorId) {
    const oldQuote = await Quotation.findOne({
      where: { id: quotationId, sellerOrganizationId: sellerOrgId },
      include: [{ model: QuotationItem, as: "items" }]
    });

    if (!oldQuote) throw new AppError("Quotation not found or unauthorized.", 404);

    if (!QuotationDomain.canTransition(oldQuote.status, "superseded")) {
      throw new AppError(`Cannot edit a quotation in '${oldQuote.status}' state.`, 400);
    }

    const transaction = await sequelize.transaction();
    try {
      // 1. Mark old as superseded
      await oldQuote.update({ status: "superseded" }, { transaction });

      // 2. Submit new quote (recursive call, bypassing active quote check because oldQuote is superseded now)
      await transaction.commit(); // commit early so submitQuotation sees the old one as superseded
      
      const newQuote = await this.submitQuotation(oldQuote.purchaseRequestId, sellerOrgId, commandData, actorId);
      return newQuote;

    } catch (err) {
      if (!transaction.finished === 'commit') {
        await transaction.rollback();
      }
      throw err;
    }
  }

  // =========================
  // WITHDRAW QUOTATION
  // =========================
  static async withdrawQuotation(quotationId, sellerOrgId) {
    const quote = await Quotation.findOne({ where: { id: quotationId, sellerOrganizationId: sellerOrgId }});
    if (!quote) throw new AppError("Quotation not found.", 404);
    
    if (!QuotationDomain.canTransition(quote.status, "withdrawn")) {
      throw new AppError(`Cannot withdraw quotation from '${quote.status}' state.`, 400);
    }

    await quote.update({ status: "withdrawn", withdrawnAt: new Date() });
    return quote;
  }
  // =========================
  // NEGOTIATE QUOTATION (Blocker 17)
  // =========================
  static async requestNegotiation(quotationId, buyerId, negotiationPayload) {
    const { PurchaseRequest, AuditLog } = require("../sequelize_setup");
    const NegotiationDomain = require("../domains/negotiationDomain");

    const quote = await Quotation.findByPk(quotationId, {
      include: [{ model: PurchaseRequest, as: "request" }]
    });

    if (!quote) throw new AppError("Quotation not found.", 404);

    const validation = NegotiationDomain.validateNegotiationRequest(quote.request, quote, buyerId);
    if (!validation.isValid) {
      throw new AppError("Negotiation validation failed: " + validation.errors.join(", "), 400);
    }

    // Create business event
    await AuditLog.create({
      user_id: buyerId,
      action: "NEGOTIATION_REQUESTED",
      entity_type: "Quotation",
      entity_id: quotationId,
      new_data: {
        eventType: "NEGOTIATION_REQUESTED",
        actorType: "BUYER",
        actorId: buyerId,
        payload: {
          message: negotiationPayload.message,
          targetPrice: negotiationPayload.targetPrice
        }
      }
    });

    // In a real system, this would trigger an email or notification to the seller.
    return { success: true, message: "Negotiation requested successfully." };
  }
}

module.exports = QuotationService;
