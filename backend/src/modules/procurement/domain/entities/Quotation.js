const DomainViolationException = require('../exceptions/DomainViolationException');
const QuotationItem = require('./QuotationItem');
const AggregateRoot = require('../../../../shared/domain/AggregateRoot');
const QuotationSubmittedEvent = require('../events/QuotationSubmittedEvent');
const QuotationSupersededEvent = require('../events/QuotationSupersededEvent');
const QuotationWithdrawnEvent = require('../events/QuotationWithdrawnEvent');
const QuotationNegotiatedEvent = require('../events/QuotationNegotiatedEvent');
const QuotationAcceptedEvent = require('../events/QuotationAcceptedEvent');

/**
 * DOMAIN ENTITY: Quotation (Aggregate Root)
 * Contains the State Machine, Invariants, and Business Rules for Quotations.
 * Pure POJO: No ORM dependencies.
 */
class Quotation extends AggregateRoot {
  constructor(data) {
    super(data.id, data.version || 1);
    this.purchaseRequestId = data.purchaseRequestId;
    this.sellerOrganizationId = data.sellerOrganizationId;
    this.status = data.status || "draft";
    
    this.subtotal = data.subtotal || 0;
    this.taxAmount = data.taxAmount || 0;
    this.discountAmount = data.discountAmount || 0;
    this.grandTotal = data.grandTotal || 0;
    
    this.paymentTerms = data.paymentTerms || null;
    this.submittedAt = data.submittedAt || null;
    this.withdrawnAt = data.withdrawnAt || null;

    this.items = (data.items || []).map(item => new QuotationItem(item));
  }

  static VALID_TRANSITIONS = {
    draft: ["submitted", "withdrawn"],
    submitted: ["withdrawn", "accepted", "rejected", "superseded", "expired", "negotiating"],
    negotiating: ["withdrawn", "accepted", "rejected", "superseded", "expired", "negotiating"],
    accepted: [],
    rejected: [],
    withdrawn: ["submitted"],
    superseded: [],
    expired: []
  };

  canTransition(newStatus) {
    const allowed = Quotation.VALID_TRANSITIONS[this.status];
    return allowed && allowed.includes(newStatus);
  }

  calculateTotals() {
    let subtotal = 0;
    let totalTax = 0;
    let totalDiscount = 0;

    for (const item of this.items) {
      subtotal += item.itemSubtotal;
      totalDiscount += item.discount;
      totalTax += item.itemTax;
    }

    this.subtotal = parseFloat(subtotal.toFixed(2));
    this.discountAmount = parseFloat(totalDiscount.toFixed(2));
    this.taxAmount = parseFloat(totalTax.toFixed(2));
    this.grandTotal = parseFloat((this.subtotal - this.discountAmount + this.taxAmount).toFixed(2));
  }

  submit(rfqData, existingQuotes) {
    if (!this.canTransition("submitted")) {
      throw new DomainViolationException(`Cannot submit quotation from '${this.status}' state.`, "INVALID_TRANSITION");
    }

    if (!this.items || this.items.length === 0) {
      throw new DomainViolationException("Quotation must include at least one item.", "MISSING_PREREQUISITES");
    }

    // Domain Rule: Validate RFQ state
    const allowedRfqStatuses = ["published", "rfq_published", "quoting"];
    if (!allowedRfqStatuses.includes(rfqData.status)) {
      throw new DomainViolationException(`Cannot submit quote: RFQ is in '${rfqData.status}' state.`, "INVALID_RFQ_STATE");
    }

    if (rfqData.expiresAt && new Date(rfqData.expiresAt) < new Date()) {
      throw new DomainViolationException("Cannot submit quote: RFQ has expired.", "EXPIRED_RFQ");
    }

    // Domain Rule: Single active quote per seller per RFQ
    const activeQuotes = existingQuotes.filter(q => 
      !["withdrawn", "superseded", "rejected", "expired"].includes(q.status)
    );
    if (activeQuotes.length > 0) {
      throw new DomainViolationException("Seller already has an active quotation for this RFQ.", "DUPLICATE_ACTIVE_QUOTE");
    }

    // Domain Rule: Secret Auctions Validation
    if (rfqData.auction_type === "secret") {
      const isInvited = (rfqData.invitations || []).some(inv => inv.sellerOrganizationId === this.sellerOrganizationId);
      if (!isInvited) {
        throw new DomainViolationException("Cannot submit quote: You were not invited to this secret RFQ.", "UNAUTHORIZED_AUCTION");
      }
    }

    // Snapshots: Hydrate missing requested info from RFQ Items
    this.hydrateFromRfqItems(rfqData.items);
    
    // Calculate final totals
    this.calculateTotals();

    // Mutate state
    const previousStatus = this.status;
    this.status = "submitted";
    this.submittedAt = new Date();

    // Domain Rule: The Aggregate manages its own events
    this.addEvent(new QuotationSubmittedEvent({
      aggregate: this,
      rfqData: rfqData,
      context: {} // Context could be passed down, but usually events carry domain data. We'll leave context for the Use Case or enrich it later.
    }));

    return { previousStatus, newStatus: this.status };
  }

  hydrateFromRfqItems(rfqItems) {
    const rfqItemMap = new Map();
    rfqItems.forEach(ri => rfqItemMap.set(ri.id, ri));

    for (const item of this.items) {
      const rfqItem = rfqItemMap.get(item.purchaseRequestItemId);
      if (!rfqItem) {
        throw new DomainViolationException(`Invalid purchaseRequestItemId: ${item.purchaseRequestItemId} not found on RFQ.`, "INVALID_ITEM");
      }
      
      item.productDNAId = item.productDNAId || rfqItem.productDNAId || null;
      item.requestedDescription = rfqItem.freeTextDescription || "N/A";
      item.requestedQuantity = rfqItem.quantity;
      item.requestedUnit = rfqItem.unit;
    }
  }

  supersede() {
    if (!this.canTransition("superseded")) {
      throw new DomainViolationException(`Cannot supersede a quotation in '${this.status}' state.`, "INVALID_TRANSITION");
    }
    
    const previousStatus = this.status;
    this.status = "superseded";

    this.addEvent(new QuotationSupersededEvent({
      aggregate: this
    }));

    return { previousStatus, newStatus: this.status };
  }

  /**
   * Factory method: Creates a new Quotation from a superseded one.
   * @param {Quotation} oldQuote 
   * @param {Array<Object>} newItems 
   * @returns {Quotation}
   */
  static createFromSuperseded(oldQuote, newItems) {
    if (oldQuote.status !== "superseded") {
      throw new DomainViolationException("Cannot spawn from a quote that is not superseded.", "INVALID_FACTORY_STATE");
    }

    return new Quotation({
      purchaseRequestId: oldQuote.purchaseRequestId,
      sellerOrganizationId: oldQuote.sellerOrganizationId,
      items: newItems,
      paymentTerms: oldQuote.paymentTerms
    });
  }

  ensureOwnedBy(sellerOrganizationId) {
    if (this.sellerOrganizationId !== sellerOrganizationId) {
      throw new DomainViolationException("You do not have permission to modify this quotation.", "UNAUTHORIZED_OWNERSHIP");
    }
  }

  withdraw(timestamp) {
    if (!this.canTransition("withdrawn")) {
      throw new DomainViolationException(`Cannot withdraw quotation from '${this.status}' state.`, "INVALID_TRANSITION");
    }

    const previousStatus = this.status;
    this.status = "withdrawn";
    this.withdrawnAt = timestamp;

    this.incrementVersion();
    this.addEvent(new QuotationWithdrawnEvent({ aggregate: this }));

    return { previousStatus, newStatus: this.status };
  }

  /**
   * Accepts the quotation.
   * Only 'submitted' or 'negotiating' quotations can be accepted.
   */
  accept({ buyerOrganizationId }) {
    if (this.status !== 'submitted' && this.status !== 'negotiating') {
      throw new DomainException("Only submitted or negotiating quotations can be accepted", "INVALID_STATE_TRANSITION");
    }

    this.status = 'accepted';
    this.incrementVersion();
    this.addEvent(new QuotationAcceptedEvent({ aggregate: this, buyerOrganizationId }));
  }

  /**
   * Buyer proposes a counter-offer, moving the quotation into 'negotiating' status
   * and incrementing its version.
   * 
   * @param {Array<Object>} counterOfferItems - Array of simple value objects for the counter offer
   * @param {Date} timestamp 
   */
  negotiate(counterOfferItems, timestamp) {
    if (!this.canTransition("negotiating")) {
      throw new DomainViolationException(`Cannot negotiate a quotation in '${this.status}' state.`, "INVALID_TRANSITION");
    }

    // Domain validation: Ensure counter offer items map to existing items
    const itemMap = new Map(this.items.map(i => [i.purchaseRequestItemId, i]));
    for (const offer of counterOfferItems) {
      const item = itemMap.get(offer.purchaseRequestItemId);
      if (!item) {
        throw new DomainViolationException(`Item ${offer.purchaseRequestItemId} not found in quotation.`, "INVALID_ITEM");
      }
      // Apply negotiated prices/quantities
      if (offer.unitPrice !== undefined) item.unitPrice = offer.unitPrice;
      if (offer.quantityOffered !== undefined) item.quantityOffered = offer.quantityOffered;
      // Re-calculate line totals
      item.calculateSubtotals();
    }

    // Re-calculate grand totals based on new item values
    this.calculateTotals();

    const previousStatus = this.status;
    this.status = "negotiating";
    
    // Explicitly bump the version to trigger optimistic locking
    this.incrementVersion();

    this.addEvent(new QuotationNegotiatedEvent({ aggregate: this, counterOfferItems }));

    return { previousStatus, newStatus: this.status };
  }
}

module.exports = Quotation;
