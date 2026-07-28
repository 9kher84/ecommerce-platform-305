const DomainEvent = require('../../../../shared/domain/DomainEvent');

class AwardCancelledEvent extends DomainEvent {
  /**
   * @param {Object} params
   * @param {import('../entities/Award')} params.aggregate
   */
  constructor({ aggregate }) {
    super("AwardCancelledEvent", aggregate.id, {}, 1, aggregate.version);
    
    this.payload = {
      awardId: aggregate.id,
      purchaseRequestId: aggregate.purchaseRequestId,
      sellerOrganizationId: aggregate.sellerOrganizationId,
      status: aggregate.status,
      notes: aggregate.notes
    };
  }
}

module.exports = AwardCancelledEvent;
