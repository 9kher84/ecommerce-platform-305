const AggregateRoot = require('../../../../shared/domain/AggregateRoot');
const DomainException = require('../../../../shared/domain/DomainException');
const EscrowCreatedEvent = require('../events/EscrowCreatedEvent');
const EscrowFundedEvent = require('../events/EscrowFundedEvent');

class Escrow extends AggregateRoot {
  /**
   * @param {Object} data 
   * @param {string} data.id
   * @param {string} data.awardId
   * @param {string} data.buyerId
   * @param {string} data.sellerId
   * @param {number} data.amount
   * @param {string} data.currency
   * @param {string} [data.status]
   * @param {number} [data.version]
   */
  constructor(data) {
    super(data.id, data.version || 1);
    this.awardId = data.awardId;
    this.buyerId = data.buyerId;
    this.sellerId = data.sellerId;
    this.amount = parseFloat(data.amount);
    this.currency = data.currency || 'SAR';
    this.status = data.status || 'pending_funding';
  }

  /**
   * Create a new Escrow account
   * @param {Object} command 
   * @param {string} command.awardId
   * @param {string} command.buyerId
   * @param {string} command.sellerId
   * @param {number} command.amount
   * @param {string} command.currency
   * @returns {Escrow}
   */
  static create(id, command) {
    if (!command.awardId) throw new DomainException("awardId is required", "MISSING_PREREQUISITES");
    if (!command.buyerId) throw new DomainException("buyerId is required", "MISSING_PREREQUISITES");
    if (!command.sellerId) throw new DomainException("sellerId is required", "MISSING_PREREQUISITES");
    if (command.amount === undefined || command.amount <= 0) throw new DomainException("amount must be greater than 0", "INVALID_AMOUNT");

    const escrow = new Escrow({
      id,
      awardId: command.awardId,
      buyerId: command.buyerId,
      sellerId: command.sellerId,
      amount: command.amount,
      currency: command.currency,
      status: 'pending_funding',
      version: 1
    });

    escrow.addEvent(new EscrowCreatedEvent({ aggregate: escrow }));
    
    return escrow;
  }

  _ensureNotTerminal() {
    if (['released', 'refunded', 'cancelled'].includes(this.status)) {
      throw new DomainException(`Cannot modify a ${this.status} Escrow. This is a terminal state.`, "TERMINAL_STATE");
    }
  }

  fund(timestamp) {
    this._ensureNotTerminal();
    if (this.status !== 'pending_funding') {
      throw new DomainException(`Cannot fund Escrow from status: ${this.status}`, "INVALID_STATE_TRANSITION");
    }

    this.status = 'funded';
    this.incrementVersion();
    this.addEvent(new EscrowFundedEvent({ aggregate: this, fundedAt: timestamp }));
  }

  release() {
    this._ensureNotTerminal();
    if (this.status !== 'funded') {
      throw new DomainException(`Cannot release Escrow from status: ${this.status}. Must be funded first.`, "INVALID_STATE_TRANSITION");
    }

    this.status = 'released';
    this.incrementVersion();
    // this.addEvent(new EscrowReleasedEvent({ aggregate: this }));
  }

  refund() {
    this._ensureNotTerminal();
    if (this.status !== 'funded') {
      throw new DomainException(`Cannot refund Escrow from status: ${this.status}. Must be funded.`, "INVALID_STATE_TRANSITION");
    }

    this.status = 'refunded';
    this.incrementVersion();
    // this.addEvent(new EscrowRefundedEvent({ aggregate: this }));
  }

  cancel() {
    this._ensureNotTerminal();
    if (this.status !== 'pending_funding') {
      throw new DomainException(`Cannot cancel Escrow from status: ${this.status}. Can only cancel before funding.`, "INVALID_STATE_TRANSITION");
    }

    this.status = 'cancelled';
    this.incrementVersion();
    // this.addEvent(new EscrowCancelledEvent({ aggregate: this }));
  }
}

module.exports = Escrow;
