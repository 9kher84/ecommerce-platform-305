const DomainEvent = require('../../../../shared/domain/DomainEvent');

class AwardConfirmedEvent extends DomainEvent {
  /**
   * @param {Object} params
   * @param {import('../entities/Award')} params.aggregate
   */
  constructor({ aggregate }) {
    super("AwardConfirmedEvent", aggregate.id, {}, 1, aggregate.version);
    
    this.payload = {
      awardId: aggregate.id,
      purchaseRequestId: aggregate.purchaseRequestId,
      quotationId: aggregate.quotationId,
      buyerOrganizationId: aggregate.buyerOrganizationId,
      sellerOrganizationId: aggregate.sellerOrganizationId,
      status: aggregate.status,
      totalAmount: aggregate.totalAmount
    };
  }
}

module.exports = AwardConfirmedEvent;
