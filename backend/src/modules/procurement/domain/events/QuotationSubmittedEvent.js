const DomainEvent = require('../../../../shared/domain/DomainEvent');

class QuotationSubmittedEvent extends DomainEvent {
  constructor({ aggregate, rfqData, context = {} }) {
    super('QuotationSubmittedEvent', aggregate.id, {
      purchaseRequestId: aggregate.purchaseRequestId,
      sellerOrganizationId: aggregate.sellerOrganizationId,
      status: aggregate.status,
      context
    }, 1, aggregate.version);
    
    this.aggregate = aggregate;
    this.rfqData = rfqData;
  }
}

module.exports = QuotationSubmittedEvent;
