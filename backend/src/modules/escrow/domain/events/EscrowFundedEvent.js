const DomainEvent = require('../../../../shared/domain/DomainEvent');

class EscrowFundedEvent extends DomainEvent {
  /**
   * @param {Object} params
   * @param {import('../entities/Escrow')} params.aggregate
   * @param {string} params.fundedAt
   */
  constructor({ aggregate, fundedAt }) {
    super("EscrowFundedEvent", aggregate.id, {}, 1, aggregate.version);
    
    this.payload = {
      escrowId: aggregate.id,
      awardId: aggregate.awardId,
      amount: aggregate.amount,
      currency: aggregate.currency,
      status: aggregate.status,
      fundedAt: fundedAt
    };
  }
}

module.exports = EscrowFundedEvent;
