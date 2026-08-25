const { sequelize, PurchaseRequest, Quotation, QuotationItem, Award, AwardLine, PurchaseOrder, PurchaseOrderLine } = require("../sequelize_setup");
const crypto = require("crypto");
const { emitOperationalEvent } = require("../utils/EventBus");

class ProcurementService {
  /**
   * Transforms an accepted Award into an independent Purchase Order with deep snapshots.
   * Marks the Award as converted (immutable).
   */
  static async generatePOFromAward(awardId, buyerId) {
    const transaction = await sequelize.transaction();
    try {
      // 1. Fetch Award with Lines
      const award = await Award.findByPk(awardId, {
        include: [{ model: AwardLine, as: "lines" }],
        transaction
      });
      if (!award) throw { statusCode: 404, message: "Award not found" };

      // Check idempotency: If PO already exists for this award, return existing PO
      const existingPO = await PurchaseOrder.findOne({
        where: { awardId: award.id },
        include: [{ model: PurchaseOrderLine, as: "lines" }],
        transaction
      });
      if (existingPO) {
        await transaction.commit();
        return existingPO;
      }

      if (award.status !== "accepted" && award.status !== "confirmed") {
        throw { statusCode: 400, message: `Cannot generate PO from award in '${award.status}' state.` };
      }

      // 2. Fetch RFQ and Quotation context for the deep snapshot
      const rfq = await PurchaseRequest.findByPk(award.purchaseRequestId, {
        attributes: ['id', 'userId', 'organization_id', 'title', 'status'],
        transaction
      });
      
      let quotation = null;
      if (award.lines && award.lines.length > 0) {
        const quoteItem = await QuotationItem.findByPk(award.lines[0].quotationItemId, {
          include: [{ model: Quotation, as: "quotation" }],
          transaction
        });
        if (quoteItem && quoteItem.quotation) {
          quotation = quoteItem.quotation;
        }
      }

      // 3. Construct deep snapshot for the PO
      const poSnapshot = {
        rfq: rfq ? rfq.toJSON() : null,
        quotation: quotation ? quotation.toJSON() : null,
        award: award.toJSON()
      };

      // 4. Generate unique PO Number
      const poNumber = `PO-${new Date().getFullYear()}-${crypto.randomBytes(4).toString("hex").toUpperCase()}`;

      // 5. Create Purchase Order
      const po = await PurchaseOrder.create({
        purchaseOrderNumber: poNumber,
        awardId: award.id,
        buyerId,
        sellerOrganizationId: award.sellerOrganizationId,
        currency: award.currency || "SAR",
        paymentTerms: quotation ? quotation.paymentTerms : null,
        businessStatus: "draft",
        fulfillmentStatus: "pending",
        snapshot: poSnapshot
      }, { transaction });

      // 6. Create Purchase Order Lines (if award lines exist)
      if (award.lines && award.lines.length > 0) {
        for (const line of award.lines) {
          await PurchaseOrderLine.create({
            purchaseOrderId: po.id,
            awardLineId: line.id,
            productDNAId: line.productDNAId,
            quantity: line.quantityAwarded,
            unitPrice: line.unitPriceAwarded,
            snapshot: line.snapshot
          }, { transaction });
        }
      }

      // 7. Update Award status to 'confirmed' (valid in Award ENUM: accepted, confirmed, completed, cancelled)
      await award.update({ status: "confirmed" }, { transaction });

      emitOperationalEvent("PO_GENERATED", "PurchaseOrder", po.id, "buyer", buyerId, { purchaseOrderNumber: poNumber, awardId: award.id });

      await transaction.commit();
      return po;
    } catch (err) {
      await transaction.rollback();
      throw err;
    }
  }

  /**
   * Issues the Draft PO to the Seller.
   */
  static async issuePurchaseOrder(poId, buyerId) {
    const transaction = await sequelize.transaction();
    try {
      const po = await PurchaseOrder.findByPk(poId, { transaction });
      if (!po) throw { statusCode: 404, message: "PurchaseOrder not found" };

      if (po.businessStatus !== "draft") {
        throw { statusCode: 400, message: `Cannot issue PO in '${po.businessStatus}' state.` };
      }

      await po.update({
        businessStatus: "issued",
        issuedAt: new Date(),
        issuedBy: buyerId
      }, { transaction });

      emitOperationalEvent("PO_ISSUED", "PurchaseOrder", po.id, "buyer", buyerId, { purchaseOrderNumber: po.purchaseOrderNumber });

      await transaction.commit();
      return po;
    } catch (err) {
      await transaction.rollback();
      throw err;
    }
  }

  /**
   * Seller Accepts the Issued PO.
   */
  static async acceptPurchaseOrder(poId, sellerUserId) {
    const transaction = await sequelize.transaction();
    try {
      const po = await PurchaseOrder.findByPk(poId, { transaction });
      if (!po) throw { statusCode: 404, message: "PurchaseOrder not found" };

      // Idempotency: If already accepted, return without error
      if (po.businessStatus === "accepted") {
        await transaction.commit();
        return po;
      }

      if (po.businessStatus !== "draft" && po.businessStatus !== "issued") {
        throw { statusCode: 400, message: `Cannot accept PO in '${po.businessStatus}' state.` };
      }

      await po.update({
        businessStatus: "accepted",
        fulfillmentStatus: "pending",
        acceptedAt: new Date(),
        acceptedBy: sellerUserId
      }, { transaction });

      emitOperationalEvent("PO_ACCEPTED", "PurchaseOrder", po.id, "seller", sellerUserId, { purchaseOrderNumber: po.purchaseOrderNumber });

      await transaction.commit();
      return po;
    } catch (err) {
      await transaction.rollback();
      throw err;
    }
  }

  /**
   * Seller Rejects the Issued PO.
   */
  static async rejectPurchaseOrder(poId, sellerUserId, reason) {
    const transaction = await sequelize.transaction();
    try {
      const po = await PurchaseOrder.findByPk(poId, { transaction });
      if (!po) throw { statusCode: 404, message: "PurchaseOrder not found" };

      // Idempotency: If already rejected, return without error
      if (po.businessStatus === "rejected") {
        await transaction.commit();
        return po;
      }

      if (po.businessStatus !== "draft" && po.businessStatus !== "issued") {
        throw { statusCode: 400, message: `Cannot reject PO in '${po.businessStatus}' state.` };
      }

      await po.update({
        businessStatus: "rejected",
      }, { transaction });

      emitOperationalEvent("PO_REJECTED", "PurchaseOrder", po.id, "seller", sellerUserId, { purchaseOrderNumber: po.purchaseOrderNumber, reason });

      await transaction.commit();
      return po;
    } catch (err) {
      await transaction.rollback();
      throw err;
    }
  }

  /**
   * Retrieves Purchase Orders for a Seller Organization
   */
  static async getSellerPurchaseOrders(sellerOrganizationId) {
    return await PurchaseOrder.findAll({
      where: { sellerOrganizationId },
      include: [{ model: PurchaseOrderLine, as: "lines" }],
      order: [["createdAt", "DESC"]]
    });
  }

}

module.exports = ProcurementService;
