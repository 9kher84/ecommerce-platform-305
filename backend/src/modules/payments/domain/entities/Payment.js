const AggregateRoot = require('../../../../shared/domain/AggregateRoot');
const DomainException = require('../../../../shared/domain/DomainException');
const PaymentAuthorizedEvent = require('../events/PaymentAuthorizedEvent');
const PaymentCapturedEvent = require('../events/PaymentCapturedEvent');
const PaymentFailedEvent = require('../events/PaymentFailedEvent');
const PaymentCancelledEvent = require('../events/PaymentCancelledEvent');

class Payment extends AggregateRoot {
  /**
   * @param {Object} data 
   * @param {string} data.id
   * @param {string} data.escrowId
   * @param {string} data.awardId
   * @param {number} data.amount
   * @param {string} data.currency
   * @param {string} data.provider
   * @param {string} [data.providerReference]
   * @param {string} [data.status]
   * @param {number} [data.version]
   */
  constructor(data) {
    super(data.id, data.version || 1);
    this.escrowId = data.escrowId;
    this.awardId = data.awardId;
    this.amount = parseFloat(data.amount);
    this.currency = data.currency || 'SAR';
    this.provider = data.provider;
    this.providerReference = data.providerReference || null;
    this.status = data.status || 'initiated';
  }

  /**
   * Initialize a new Payment
   */
  static create(id, command) {
    if (!command.escrowId) throw new DomainException("escrowId is required", "MISSING_PREREQUISITES");
    if (!command.awardId) throw new DomainException("awardId is required", "MISSING_PREREQUISITES");
    if (command.amount === undefined || command.amount <= 0) throw new DomainException("amount must be greater than 0", "INVALID_AMOUNT");
    if (!command.provider) throw new DomainException("provider is required", "MISSING_PREREQUISITES");

    const payment = new Payment({
      id,
      escrowId: command.escrowId,
      awardId: command.awardId,
      amount: command.amount,
      currency: command.currency,
      provider: command.provider,
      status: 'initiated',
      version: 1
    });

    return payment;
  }

  _ensureNotTerminal() {
    if (['captured', 'failed', 'cancelled'].includes(this.status)) {
      throw new DomainException(`Cannot modify a ${this.status} Payment. This is a terminal state.`, "TERMINAL_STATE");
    }
  }

  /**
   * Transitions payment to 'processing'.
   * This is called before the gateway request is made.
   */
  process() {
    this._ensureNotTerminal();
    if (this.status !== 'initiated') {
      throw new DomainException(`Cannot process Payment from status: ${this.status}`, "INVALID_STATE_TRANSITION");
    }

    this.status = 'processing';
    this.incrementVersion();
  }

  /**
   * Transitions payment to 'authorized' upon successful gateway reservation.
   * @param {string} reference Provider's transaction reference
   */
  authorize(reference) {
    this._ensureNotTerminal();
    if (this.status !== 'processing') {
      throw new DomainException(`Cannot authorize Payment from status: ${this.status}. Must be processing.`, "INVALID_STATE_TRANSITION");
    }

    this.status = 'authorized';
    this.providerReference = reference;
    this.incrementVersion();
    this.addEvent(new PaymentAuthorizedEvent({ aggregate: this }));
  }

  /**
   * Transitions payment to 'captured'. Terminal State.
   * @param {string} reference Provider's transaction reference (optional if already authorized)
   */
  capture(reference = null) {
    this._ensureNotTerminal();
    if (this.status !== 'authorized' && this.status !== 'processing') {
      throw new DomainException(`Cannot capture Payment from status: ${this.status}.`, "INVALID_STATE_TRANSITION");
    }

    this.status = 'captured';
    if (reference) this.providerReference = reference;
    this.incrementVersion();
    this.addEvent(new PaymentCapturedEvent({ aggregate: this }));
  }

  /**
   * Transitions payment to 'failed'. Terminal State.
   * @param {string} reason Failure reason from the provider
   * @param {string} reference Provider's reference if available
   */
  fail(reason, reference = null) {
    this._ensureNotTerminal();
    
    this.status = 'failed';
    this.failureReason = reason;
    if (reference) this.providerReference = reference;
    this.incrementVersion();
    this.addEvent(new PaymentFailedEvent({ aggregate: this }));
  }

  /**
   * Transitions payment to 'cancelled'. Terminal State.
   */
  cancel() {
    this._ensureNotTerminal();
    if (this.status !== 'initiated') {
      throw new DomainException(`Cannot cancel Payment from status: ${this.status}. Can only cancel before processing.`, "INVALID_STATE_TRANSITION");
    }

    this.status = 'cancelled';
    this.incrementVersion();
    this.addEvent(new PaymentCancelledEvent({ aggregate: this }));
  }
}

module.exports = Payment;
