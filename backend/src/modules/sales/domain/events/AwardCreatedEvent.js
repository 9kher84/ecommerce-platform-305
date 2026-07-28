const DomainEvent = require('../../../../shared/domain/DomainEvent');

class AwardCreatedEvent extends DomainEvent {
  /**
   * @param {Object} params
   * @param {import('../entities/Award')} params.aggregate
   */
  constructor({ aggregate }) {
    super("AwardCreatedEvent", aggregate.id, aggregate.version);
    
    // We only expose primitives and DTOs in events, not the full Aggregate object.
    this.payload = {
      awardId: aggregate.id,
      purchaseRequestId: aggregate.purchaseRequestId,
      quotationId: aggregate.quotationId,
      buyerOrganizationId: aggregate.buyerOrganizationId,
      sellerOrganizationId: aggregate.sellerOrganizationId,
      totalAmount: aggregate.totalAmount,
      status: aggregate.status,
      linesCount: aggregate.lines.length
    };
  }
}

module.exports = AwardCreatedEvent;
