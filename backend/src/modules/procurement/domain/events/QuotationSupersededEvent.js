const DomainEvent = require('../../../../shared/domain/DomainEvent');

class QuotationSupersededEvent extends DomainEvent {
  constructor({ aggregate, context = {} }) {
    super('QuotationSupersededEvent', aggregate.id, {
      purchaseRequestId: aggregate.purchaseRequestId,
      sellerOrganizationId: aggregate.sellerOrganizationId,
      status: aggregate.status,
      context
    }, 1, aggregate.version); // eventVersion = 1
    
    this.aggregate = aggregate;
  }
}

module.exports = QuotationSupersededEvent;
