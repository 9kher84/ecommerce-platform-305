const DomainEvent = require('../../../../shared/domain/DomainEvent');

class AwardCompletedEvent extends DomainEvent {
  /**
   * @param {Object} params
   * @param {import('../entities/Award')} params.aggregate
   */
  constructor({ aggregate }) {
    super("AwardCompletedEvent", aggregate.id, {}, 1, aggregate.version);
    
    this.payload = {
      awardId: aggregate.id,
      purchaseRequestId: aggregate.purchaseRequestId,
      sellerOrganizationId: aggregate.sellerOrganizationId,
      status: aggregate.status
    };
  }
}

module.exports = AwardCompletedEvent;
