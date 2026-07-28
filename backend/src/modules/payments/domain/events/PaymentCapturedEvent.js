const DomainEvent = require('../../../../shared/domain/DomainEvent');

class PaymentCapturedEvent extends DomainEvent {
  /**
   * @param {Object} params
   * @param {import('../entities/Payment')} params.aggregate
   */
  constructor({ aggregate }) {
    super("PaymentCapturedEvent", aggregate.id, {}, 1, aggregate.version);
    
    this.payload = {
      paymentId: aggregate.id,
      escrowId: aggregate.escrowId,
      awardId: aggregate.awardId,
      amount: aggregate.amount,
      currency: aggregate.currency,
      provider: aggregate.provider,
      providerReference: aggregate.providerReference,
      status: aggregate.status,
      capturedAt: new Date().toISOString()
    };
  }
}

module.exports = PaymentCapturedEvent;
