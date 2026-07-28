const DomainEvent = require('../../../../shared/domain/DomainEvent');

class QuotationWithdrawnEvent extends DomainEvent {
  constructor({ aggregate }) {
    super('QuotationWithdrawnEvent', aggregate.id, {
      purchaseRequestId: aggregate.purchaseRequestId,
      sellerOrganizationId: aggregate.sellerOrganizationId,
      status: aggregate.status,
      withdrawnAt: aggregate.withdrawnAt
    }, 1, aggregate.version);
    
    this.aggregate = aggregate;
  }
}

module.exports = QuotationWithdrawnEvent;
