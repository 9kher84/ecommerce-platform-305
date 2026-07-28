const DomainEvent = require('../../../../shared/domain/DomainEvent');

class QuotationAcceptedEvent extends DomainEvent {
  /**
   * @param {Object} params
   * @param {import('../entities/Quotation')} params.aggregate
   * @param {string} params.buyerOrganizationId
   */
  constructor({ aggregate, buyerOrganizationId }) {
    super("QuotationAcceptedEvent", aggregate.id, {}, 1, aggregate.version);
    
    this.payload = {
      quotationId: aggregate.id,
      purchaseRequestId: aggregate.purchaseRequestId,
      buyerOrganizationId: buyerOrganizationId,
      sellerOrganizationId: aggregate.sellerOrganizationId,
      status: aggregate.status
    };
  }
}

module.exports = QuotationAcceptedEvent;
