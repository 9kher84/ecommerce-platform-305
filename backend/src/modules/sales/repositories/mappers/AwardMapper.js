const Award = require('../../domain/entities/Award');
const AwardLine = require('../../domain/entities/AwardLine');

class AwardMapper {
  static toDomain(sequelizeModel) {
    if (!sequelizeModel) return null;

    return new Award({
      id: sequelizeModel.id,
      purchaseRequestId: sequelizeModel.purchaseRequestId,
      quotationId: sequelizeModel.quotationId,
      buyerOrganizationId: sequelizeModel.buyerOrganizationId,
      sellerOrganizationId: sequelizeModel.sellerOrganizationId,
      status: sequelizeModel.status,
      totalAmount: sequelizeModel.totalAmount,
      notes: sequelizeModel.notes,
      version: sequelizeModel.version,
      lines: (sequelizeModel.AwardLines || []).map(line => new AwardLine({
        id: line.id,
        awardId: line.awardId,
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
        notes: line.notes,
        snapshot: line.snapshot
      }))
    });
  }

  static toPersistence(aggregate) {
    return {
      id: aggregate.id,
      purchaseRequestId: aggregate.purchaseRequestId,
      quotationId: aggregate.quotationId,
      buyerOrganizationId: aggregate.buyerOrganizationId,
      sellerOrganizationId: aggregate.sellerOrganizationId,
      status: aggregate.status,
      totalAmount: aggregate.totalAmount,
      notes: aggregate.notes,
      version: aggregate.version,
      lines: aggregate.lines.map(line => ({
        id: line.id,
        awardId: line.awardId,
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
        notes: line.notes,
        snapshot: line.snapshot
      }))
    };
  }
}

module.exports = AwardMapper;
