const DomainEvent = require('../../../../shared/domain/DomainEvent');

class EscrowCreatedEvent extends DomainEvent {
  /**
   * @param {Object} params
   * @param {import('../entities/Escrow')} params.aggregate
   */
  constructor({ aggregate }) {
    super("EscrowCreatedEvent", aggregate.id, {}, 1, aggregate.version);
    
    this.payload = {
      escrowId: aggregate.id,
      awardId: aggregate.awardId,
      buyerId: aggregate.buyerId,
      sellerId: aggregate.sellerId,
      amount: aggregate.amount,
      currency: aggregate.currency,
      status: aggregate.status
    };
  }
}

module.exports = EscrowCreatedEvent;
