const AggregateRoot = require('../../../../shared/domain/AggregateRoot');
const DomainException = require('../../../../shared/domain/DomainException');
const AwardCreatedEvent = require('../events/AwardCreatedEvent');
const AwardConfirmedEvent = require('../events/AwardConfirmedEvent');
const AwardCancelledEvent = require('../events/AwardCancelledEvent');
const AwardCompletedEvent = require('../events/AwardCompletedEvent');
const AwardLine = require('./AwardLine');

class Award extends AggregateRoot {
  /**
   * @param {Object} data 
   * @param {string} data.id
   * @param {string} data.purchaseRequestId
   * @param {string} data.quotationId
   * @param {string} data.buyerOrganizationId
   * @param {string} data.sellerOrganizationId
   * @param {string} data.status
   * @param {number} data.totalAmount
   * @param {string} [data.notes]
   * @param {Array<AwardLine|Object>} data.lines
   * @param {number} [data.version=1]
   */
  constructor(data) {
    super(data.id, data.version || 1);
    this.purchaseRequestId = data.purchaseRequestId;
    this.quotationId = data.quotationId;
    this.buyerOrganizationId = data.buyerOrganizationId;
    this.sellerOrganizationId = data.sellerOrganizationId;
    this.status = data.status || 'accepted';
    this.totalAmount = parseFloat(data.totalAmount || 0);
    this.notes = data.notes || null;

    this.lines = (data.lines || []).map(line => {
      return line instanceof AwardLine ? line : new AwardLine({ ...line, awardId: this.id });
    });
  }

  /**
   * Factory Method to create a new Award.
   * Enforces business invariants at creation time.
   * @param {Object} command 
   */
  static create(command) {
    const { v4: uuidv4 } = require('uuid');
    const awardId = uuidv4();

    if (!command.purchaseRequestId) throw new DomainException("PurchaseRequestId is required", "MISSING_PREREQUISITES");
    if (!command.quotationId) throw new DomainException("QuotationId is required", "MISSING_PREREQUISITES");
    if (!command.buyerOrganizationId) throw new DomainException("BuyerOrganizationId is required", "MISSING_PREREQUISITES");
    if (!command.sellerOrganizationId) throw new DomainException("SellerOrganizationId is required", "MISSING_PREREQUISITES");
    if (!command.lines || command.lines.length === 0) {
      throw new DomainException("Award must contain at least one line", "EMPTY_AWARD");
    }

    const award = new Award({
      id: awardId,
      purchaseRequestId: command.purchaseRequestId,
      quotationId: command.quotationId,
      buyerOrganizationId: command.buyerOrganizationId,
      sellerOrganizationId: command.sellerOrganizationId,
      status: 'accepted',
      notes: command.notes,
      version: 1,
      lines: command.lines.map(l => ({ ...l, id: uuidv4(), awardId }))
    });

    // Calculate total amount from lines
    award.totalAmount = award.lines.reduce((sum, line) => sum + line.getLineTotal(), 0);

    // Register Domain Event
    award.addEvent(new AwardCreatedEvent({ aggregate: award }));

    return award;
  }

  // --- State Machine ---

  /**
   * Helper to ensure AL-01: Terminal States are not mutated.
   */
  _ensureNotTerminal() {
    if (this.status === 'completed' || this.status === 'cancelled') {
      throw new DomainException(`Cannot modify a ${this.status} Award. This is a terminal state.`, "TERMINAL_STATE");
    }
  }

  /**
   * Confirms the Award.
   * Can only be called if status is 'accepted'.
   */
  confirm() {
    this._ensureNotTerminal();
    if (this.status !== 'accepted') {
      throw new DomainException(`Cannot confirm Award from status: ${this.status}`, "INVALID_STATE_TRANSITION");
    }

    this.status = 'confirmed';
    this.incrementVersion();
    this.addEvent(new AwardConfirmedEvent({ aggregate: this }));
  }

  /**
   * Cancels the Award.
   * Can be called if status is 'accepted' or 'confirmed'.
   * @param {string} reason 
   */
  cancel(reason) {
    this._ensureNotTerminal();
    
    this.status = 'cancelled';
    this.notes = reason ? `Cancelled: ${reason}` : 'Cancelled';
    this.incrementVersion();
    this.addEvent(new AwardCancelledEvent({ aggregate: this }));
  }

  /**
   * Completes the Award.
   * Can only be called if status is 'confirmed'.
   */
  complete() {
    this._ensureNotTerminal();
    if (this.status !== 'confirmed') {
      throw new DomainException(`Cannot complete Award from status: ${this.status}. Must be confirmed first.`, "INVALID_STATE_TRANSITION");
    }

    this.status = 'completed';
    this.incrementVersion();
    this.addEvent(new AwardCompletedEvent({ aggregate: this }));
  }
}

module.exports = Award;
