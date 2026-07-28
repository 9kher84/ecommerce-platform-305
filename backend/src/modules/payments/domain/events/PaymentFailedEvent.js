const DomainEvent = require('../../../../shared/domain/DomainEvent');

class PaymentFailedEvent extends DomainEvent {
  /**
   * @param {Object} params
   * @param {import('../entities/Payment')} params.aggregate
   */
  constructor({ aggregate }) {
    super("PaymentFailedEvent", aggregate.id, {}, 1, aggregate.version);
    
    this.payload = {
      paymentId: aggregate.id,
      escrowId: aggregate.escrowId,
      awardId: aggregate.awardId,
      amount: aggregate.amount,
      currency: aggregate.currency,
      provider: aggregate.provider,
      providerReference: aggregate.providerReference,
      status: aggregate.status,
      failureReason: aggregate.failureReason
    };
  }
}

module.exports = PaymentFailedEvent;
