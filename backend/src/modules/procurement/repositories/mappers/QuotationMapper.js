const QuotationAggregate = require('../../domain/entities/Quotation');

class QuotationMapper {
  static toDomain(sequelizeModel) {
    if (!sequelizeModel) return null;

    const data = {
      id: sequelizeModel.id,
      purchaseRequestId: sequelizeModel.purchaseRequestId,
      sellerOrganizationId: sequelizeModel.sellerOrganizationId,
      status: sequelizeModel.status,
      subtotal: sequelizeModel.subtotal,
      taxAmount: sequelizeModel.taxAmount,
      discountAmount: sequelizeModel.discountAmount,
      grandTotal: sequelizeModel.grandTotal,
      paymentTerms: sequelizeModel.paymentTerms,
      submittedAt: sequelizeModel.submittedAt,
      withdrawnAt: sequelizeModel.withdrawnAt,
      version: sequelizeModel.version
    };

    if (sequelizeModel.items && Array.isArray(sequelizeModel.items)) {
      data.items = sequelizeModel.items.map(item => ({
        id: item.id,
        purchaseRequestItemId: item.purchaseRequestItemId,
        productDNAId: item.productDNAId,
        requestedDescription: item.requestedDescription,
        requestedQuantity: item.requestedQuantity,
        requestedUnit: item.requestedUnit,
        unitPrice: item.unitPrice,
        quantityOffered: item.quantityOffered,
        currency: item.currency,
        taxRate: item.taxRate,
        discount: item.discount,
        leadTime: item.leadTime,
        notes: item.notes
      }));
    }

    return new QuotationAggregate(data);
  }

  static toPersistence(aggregate) {
    const data = {
      purchaseRequestId: aggregate.purchaseRequestId,
      sellerOrganizationId: aggregate.sellerOrganizationId,
      status: aggregate.status,
      subtotal: aggregate.subtotal,
      taxAmount: aggregate.taxAmount,
      discountAmount: aggregate.discountAmount,
      grandTotal: aggregate.grandTotal,
      paymentTerms: aggregate.paymentTerms,
      submittedAt: aggregate.submittedAt,
      withdrawnAt: aggregate.withdrawnAt,
      version: aggregate.version
    };

    if (aggregate.id) {
      data.id = aggregate.id;
    }

    const items = aggregate.items.map(item => {
      const itemData = {
        purchaseRequestItemId: item.purchaseRequestItemId,
        productDNAId: item.productDNAId,
        requestedDescription: item.requestedDescription,
        requestedQuantity: item.requestedQuantity,
        requestedUnit: item.requestedUnit,
        unitPrice: item.unitPrice,
        quantityOffered: item.quantityOffered,
        currency: item.currency,
        taxRate: item.taxRate,
        discount: item.discount,
        leadTime: item.leadTime,
        notes: item.notes
      };
      if (item.id) itemData.id = item.id;
      return itemData;
    });

    return { quotation: data, items };
  }
}

module.exports = QuotationMapper;
