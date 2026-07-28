const DomainEvent = require('../../../../shared/domain/DomainEvent');

class QuotationNegotiatedEvent extends DomainEvent {
  constructor({ aggregate, counterOfferItems }) {
    super('QuotationNegotiatedEvent', aggregate.id, {
      purchaseRequestId: aggregate.purchaseRequestId,
      sellerOrganizationId: aggregate.sellerOrganizationId,
      status: aggregate.status,
      counterOfferItems: counterOfferItems
    }, 1, aggregate.version);
    
    this.aggregate = aggregate;
  }
}

module.exports = QuotationNegotiatedEvent;
