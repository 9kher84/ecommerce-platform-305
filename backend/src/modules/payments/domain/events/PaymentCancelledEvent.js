const DomainEvent = require('../../../../shared/domain/DomainEvent');

class PaymentCancelledEvent extends DomainEvent {
  /**
   * @param {Object} params
   * @param {import('../entities/Payment')} params.aggregate
   */
  constructor({ aggregate }) {
    super("PaymentCancelledEvent", aggregate.id, {}, 1, aggregate.version);
    
    this.payload = {
      paymentId: aggregate.id,
      escrowId: aggregate.escrowId,
      awardId: aggregate.awardId,
      amount: aggregate.amount,
      currency: aggregate.currency,
      provider: aggregate.provider,
      status: aggregate.status
    };
  }
}

module.exports = PaymentCancelledEvent;
