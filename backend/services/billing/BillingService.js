const { 
  PurchaseOrder, 
  PurchaseOrderLine, 
  Award, 
  OrganizationUser, 
  Invoice, 
  InvoiceLine, 
  Receipt, 
  ReceiptLine,
  sequelize 
} = require("../../sequelize_setup");

class BillingService {
  /**
   * Calculates the authoritative line-by-line invoice eligibility for a Purchase Order.
   * Prevents row multiplication by aggregating Receipts and Invoices independently per line.
   * 
   * @param {string} poId - UUID of the Purchase Order
   * @param {object} [options={}] - Options object (e.g. { transaction })
   * @returns {Promise<object>} Eligibility summary object
   */
  static async getInvoiceEligibility(poId, options = {}) {
    const transaction = options.transaction;

    const po = await PurchaseOrder.findByPk(poId, {
      include: [
        { model: PurchaseOrderLine, as: "lines" },
        { model: Award, as: "award" }
      ],
      transaction
    });

    if (!po) {
      throw { statusCode: 404, message: "Purchase Order not found" };
    }

    // 1. Independent aggregation of accepted quantities from Receipts
    const receipts = await Receipt.findAll({
      where: { purchaseOrderId: poId },
      include: [{ model: ReceiptLine, as: "lines" }],
      transaction
    });

    const acceptedByLine = {};
    receipts.forEach(r => {
      if (r.lines && Array.isArray(r.lines)) {
        r.lines.forEach(rl => {
          const lineId = rl.purchaseOrderLineId;
          const acc = parseFloat(rl.acceptedQuantity) || 0;
          // acceptedQuantity accumulates across all receipts
          acceptedByLine[lineId] = (acceptedByLine[lineId] || 0) + acc;
        });
      }
    });

    // 2. Independent aggregation of invoiced quantities from Invoices (excluding cancelled)
    const invoices = await Invoice.findAll({
      where: { 
        purchaseOrderId: poId,
        status: { [sequelize.Sequelize.Op.ne]: "cancelled" }
      },
      include: [{ model: InvoiceLine, as: "lines" }],
      transaction
    });

    const invoicedByLine = {};
    invoices.forEach(inv => {
      if (inv.lines && Array.isArray(inv.lines)) {
        inv.lines.forEach(il => {
          const lineId = il.purchaseOrderLineId;
          const qty = parseFloat(il.invoicedQuantity) || 0;
          invoicedByLine[lineId] = (invoicedByLine[lineId] || 0) + qty;
        });
      }
    });

    // 3. Map line-by-line summary
    const linesEligibility = po.lines.map(line => {
      const ordered = parseFloat(line.quantity) || 0;
      const unitPrice = parseFloat(line.unitPrice) || 0;
      const accepted = acceptedByLine[line.id] || 0;
      const invoiced = invoicedByLine[line.id] || 0;
      const eligible = Math.max(0, accepted - invoiced);

      return {
        purchaseOrderLineId: line.id,
        productDNAId: line.productDNAId || null,
        orderedQuantity: ordered,
        unitPrice,
        cumulativeAcceptedQuantity: accepted,
        cumulativeInvoicedQuantity: invoiced,
        eligibleQuantity: eligible
      };
    });

    const totalEligibleAmount = linesEligibility.reduce(
      (sum, l) => sum + (l.eligibleQuantity * l.unitPrice), 
      0
    );

    return {
      purchaseOrderId: po.id,
      purchaseOrderNumber: po.purchaseOrderNumber,
      buyerId: po.buyerId,
      buyerOrganizationId: po.award?.buyerOrganizationId || null,
      sellerOrganizationId: po.sellerOrganizationId,
      currency: po.currency || "SAR",
      lines: linesEligibility,
      totalEligibleAmount
    };
  }

  /**
   * Transactional command to issue a canonical B2B Invoice against accepted receipt quantities.
   * Enforces strict billing invariants and pessimistic row locking to prevent concurrent over-invoicing.
   * 
   * @param {string} poId - UUID of the Purchase Order
   * @param {Array<{purchaseOrderLineId: string, quantity: number, receiptLineId?: string}>} lines - Line items to bill
   * @param {string} buyerUserId - User ID of the requesting buyer
   * @param {object} [options={}] - Options object
   * @returns {Promise<object>} Created Invoice record with lines
   */
  static async issueInvoiceFromPO(poId, lines, buyerUserId, options = {}) {
    if (!poId) {
      throw { statusCode: 400, message: "poId is required" };
    }
    if (!buyerUserId) {
      throw { statusCode: 400, message: "buyerUserId is required" };
    }
    if (!lines || !Array.isArray(lines) || lines.length === 0) {
      throw { statusCode: 400, message: "lines array is required" };
    }

    const executeInTransaction = async (tx) => {
      // 1. Fetch PO with row lock (LOCK FOR UPDATE on primary PurchaseOrder record)
      const poLocked = await PurchaseOrder.findByPk(poId, {
        lock: tx.LOCK.UPDATE,
        transaction: tx
      });

      if (!poLocked) {
        throw { statusCode: 404, message: "Purchase Order not found" };
      }

      // Fetch PO relations (lines & award)
      const po = await PurchaseOrder.findByPk(poId, {
        include: [
          { model: PurchaseOrderLine, as: "lines" },
          { model: Award, as: "award" }
        ],
        transaction: tx
      });

      // PO State Validation: Must be accepted strictly. 'closed' or any other status is prohibited.
      if (po.businessStatus !== "accepted") {
        throw { 
          statusCode: 400, 
          message: `Cannot issue invoice for Purchase Order in '${po.businessStatus}' state. Purchase Order must be 'accepted'.` 
        };
      }

      // Authorization Check: buyerUserId or buyerOrganizationId match
      if (po.buyerId !== buyerUserId) {
        let isOrgUser = false;
        if (po.award?.buyerOrganizationId) {
          const orgUser = await OrganizationUser.findOne({
            where: { 
              organization_id: po.award.buyerOrganizationId,
              user_id: buyerUserId
            },
            transaction: tx
          });
          if (orgUser) isOrgUser = true;
        }

        if (!isOrgUser) {
          throw { statusCode: 403, message: "Unauthorized. Buyer user does not own this Purchase Order." };
        }
      }

      // 2. Fetch current eligibility within transaction
      const eligibility = await this.getInvoiceEligibility(poId, { transaction: tx });
      const eligibilityByLine = {};
      eligibility.lines.forEach(l => {
        eligibilityByLine[l.purchaseOrderLineId] = l;
      });

      // 3. Validate requested billing lines against eligibility
      const linesToCreate = [];
      let invoiceTotalAmount = 0;

      for (const reqLine of lines) {
        const lineId = reqLine.purchaseOrderLineId;
        const requestedQty = parseFloat(reqLine.quantity) || 0;

        if (requestedQty <= 0) {
          continue; // Skip lines with zero or negative quantity
        }

        const lineEligibility = eligibilityByLine[lineId];
        if (!lineEligibility) {
          throw { 
            statusCode: 400, 
            message: `Line item '${lineId}' does not belong to Purchase Order '${poId}'` 
          };
        }

        // Strict Invariant Enforcement: newInvoicedQuantity <= eligibleQuantity
        if (requestedQty > lineEligibility.eligibleQuantity) {
          throw { 
            statusCode: 400, 
            message: `Billing invariant violated for line '${lineId}'. Requested: ${requestedQty}, Eligible: ${lineEligibility.eligibleQuantity}` 
          };
        }

        const unitPrice = lineEligibility.unitPrice;
        const lineTotal = requestedQty * unitPrice;

        linesToCreate.push({
          purchaseOrderLineId: lineId,
          receiptLineId: reqLine.receiptLineId || null,
          invoicedQuantity: requestedQty,
          unitPrice,
          totalAmount: lineTotal
        });

        invoiceTotalAmount += lineTotal;
      }

      if (linesToCreate.length === 0) {
        throw { 
          statusCode: 400, 
          message: "No valid positive quantities requested for billing" 
        };
      }

      // Determine seller user ID deterministically from sellerOrganizationId
      let sellerUserId = null;
      if (po.sellerOrganizationId) {
        const orgUser = await OrganizationUser.findOne({
          where: { 
            organization_id: po.sellerOrganizationId,
            is_primary: true
          },
          transaction: tx
        }) || await OrganizationUser.findOne({
          where: { organization_id: po.sellerOrganizationId },
          transaction: tx
        });
        if (orgUser) sellerUserId = orgUser.user_id;
      }

      // STRICT FINANCIAL INVARIANT: Seller user identity must be resolved and must NEVER fall back to buyer.
      if (!sellerUserId || sellerUserId === buyerUserId) {
        throw { 
          statusCode: 422, 
          message: "Cannot resolve seller user identity for seller organization. Self-invoicing or missing seller user is strictly prohibited." 
        };
      }

      // 4. Set Invoice metadata
      const dueDate = new Date();
      const dueDays = parseInt(process.env.INVOICE_DUE_DAYS) || 30;
      dueDate.setDate(dueDate.getDate() + dueDays);

      const autoCancelDate = new Date();
      const cancelDays = parseInt(process.env.INVOICE_AUTO_CANCEL_DAYS) || 45;
      autoCancelDate.setDate(autoCancelDate.getDate() + cancelDays);

      // 5. Create Invoice Header (Canonical B2B: purchaseOrderId set, dealId = null)
      const invoice = await Invoice.create({
        purchaseOrderId: po.id,
        dealId: null, // Canonical B2B Invoice strictly sets dealId to NULL
        buyerId: buyerUserId,
        sellerId: sellerUserId,
        status: "pending", // Current schema supports pending/paid/cancelled
        dueDate,
        autoCancelDate,
        totalAmount: invoiceTotalAmount,
        taxAmount: 0,
        currency: po.currency || "SAR",
        items: linesToCreate.map(l => ({
          description: `PO Item ${l.purchaseOrderLineId}`,
          quantity: l.invoicedQuantity,
          unitPrice: l.unitPrice,
          totalPrice: l.totalAmount
        }))
      }, { transaction: tx });

      // 6. Create InvoiceLines
      const invoiceLines = await Promise.all(
        linesToCreate.map(l => 
          InvoiceLine.create({
            invoiceId: invoice.id,
            purchaseOrderLineId: l.purchaseOrderLineId,
            receiptLineId: l.receiptLineId,
            invoicedQuantity: l.invoicedQuantity,
            unitPrice: l.unitPrice,
            totalAmount: l.totalAmount
          }, { transaction: tx })
        )
      );

      const result = invoice.toJSON();
      result.lines = invoiceLines.map(il => il.toJSON());
      return result;
    };

    if (options.transaction) {
      return executeInTransaction(options.transaction);
    } else {
      return sequelize.transaction(executeInTransaction);
    }
  }
}

module.exports = BillingService;
