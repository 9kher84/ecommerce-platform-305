const { sequelize, PurchaseRequest, PurchaseRequestItem, Quotation, QuotationItem, Award, AwardLine, AuditLog } = require("../sequelize_setup");
const AwardDomain = require("../domains/awardDomain");

class AwardService {
  /**
   * Finalizes an award by creating Award and AwardLine records.
   * @param {string} rfqId 
   * @param {string} buyerId 
   * @param {Object} awardSelections - { [prItemId]: quoteItemId }
   */
  static async submitAward(rfqId, buyerId, awardSelections) {
    const transaction = await sequelize.transaction();
    try {
      // 1. Fetch RFQ Aggregate
      const rfq = await PurchaseRequest.findByPk(rfqId, {
        include: [{ model: PurchaseRequestItem, as: "items" }],
        transaction
      });
      if (!rfq) throw { statusCode: 404, message: "PurchaseRequest not found" };

      // 2. Fetch Quotations
      const quotations = await Quotation.findAll({
        where: { purchaseRequestId: rfqId },
        include: [{ model: QuotationItem, as: "items" }],
        transaction
      });

      // 3. Domain Validation
      const { isValid, errors, validLines } = AwardDomain.validateAwardSelection(rfq, quotations, awardSelections, buyerId);
      if (!isValid) {
        throw { statusCode: 400, message: "Award validation failed", errors };
      }

      // 4. Group lines by supplier to create Awards
      const supplierGroups = {};
      validLines.forEach(line => {
        if (!supplierGroups[line.sellerOrganizationId]) {
          supplierGroups[line.sellerOrganizationId] = [];
        }
        supplierGroups[line.sellerOrganizationId].push(line);
      });

      const createdAwards = [];
      const newAwardedItemIds = [];

      for (const [sellerOrgId, lines] of Object.entries(supplierGroups)) {
        // Compute total amount for this award
        const totalAmount = lines.reduce((sum, l) => sum + (Number(l.unitPriceAwarded) * Number(l.quantityAwarded)), 0);

        // Create Award
        const award = await Award.create({
          purchaseRequestId: rfqId,
          sellerOrganizationId: sellerOrgId,
          status: "accepted",
          totalAmount
        }, { transaction });

        // Create AwardLines
        for (const line of lines) {
          await AwardLine.create({
            awardId: award.id,
            purchaseRequestItemId: line.purchaseRequestItemId,
            quotationItemId: line.quotationItemId,
            sellerOrganizationId: line.sellerOrganizationId,
            productDNAId: line.productDNAId,
            quantityAwarded: line.quantityAwarded,
            unitPriceAwarded: line.unitPriceAwarded,
            currency: line.currency,
            taxRate: line.taxRate,
            discount: line.discount,
            leadTime: line.leadTime,
            snapshot: line.snapshot
          }, { transaction });

          newAwardedItemIds.push(line.purchaseRequestItemId);
        }
        createdAwards.push(award.id);
      }

      // 5. Update RFQ Items Status
      await PurchaseRequestItem.update(
        { status: "awarded" },
        { where: { id: newAwardedItemIds }, transaction }
      );

      // 6. Derive & Update RFQ Status
      const newRfqStatus = AwardDomain.deriveRfqStatus(rfq.items, newAwardedItemIds);
      if (newRfqStatus !== rfq.status) {
        await rfq.update({ status: newRfqStatus }, { transaction });
      }

      // 7. Audit Logging (Structured JSON Event)
      await AuditLog.create({
        user_id: buyerId,
        action: "RFQ_AWARDED",
        entity_type: "PurchaseRequest",
        entity_id: rfqId,
        new_data: {
          eventType: "RFQ_AWARDED",
          actorType: "BUYER",
          actorId: buyerId,
          payload: {
            awardedItems: newAwardedItemIds,
            createdAwards,
            newStatus: newRfqStatus
          }
        }
      }, { transaction });

      await transaction.commit();
      return { createdAwards, newRfqStatus };
    } catch (err) {
      await transaction.rollback();
      throw err;
    }
  }
}

module.exports = AwardService;
