const DomainViolationException = require('../exceptions/DomainViolationException');
const RequestPublishedEvent = require('../events/RequestPublishedEvent');
const RequestCreatedEvent = require('../events/RequestCreatedEvent');
const AggregateRoot = require('../../../../shared/domain/AggregateRoot');
const { v4: uuidv4 } = require('uuid');

/**
 * DOMAIN ENTITY: PurchaseRequest (Aggregate Root)
 * Contains the true state machine and invariants.
 */
class PurchaseRequest extends AggregateRoot {
  constructor(data) {
    super(data.id, data.version || 1);
    this.userId = data.userId;
    this.sectorId = data.sectorId;
    this.status = data.status;
    this.rfqStatus = data.rfqStatus;
    this.statusHistory = data.statusHistory || [];
    this.items = data.items || [];
    this.invitations = data.invitations || [];
    this.auction_type = data.auction_type;
    this.expiresAt = data.expiresAt;
    
    // Core details mapped from old model
    this.title = data.title;
    this.description = data.description;
    this.deliveryLocations = data.deliveryLocations || [];
    this.requiresDelivery = data.requiresDelivery;
    this.contactNumbers = data.contactNumbers || [];
    this.images = data.images || [];
  }

  static STATUS_TRANSITIONS = {
    draft: ["published", "rfq_published"],
    published: ["ready_for_quotation", "under_review", "quoting"],
    ready_for_quotation: ["quoting", "cancelled"],
    rfq_published: ["ready_for_quotation", "quoting", "cancelled"],
    under_review: ["published", "cancelled"],
    quoting: ["awaiting_decision", "deal_in_progress"],
    awaiting_decision: ["accepted", "partially_awarded", "deal_in_progress"],
    partially_awarded: ["accepted", "deal_in_progress"],
    accepted: ["deal_in_progress", "completed"],
    deal_in_progress: ["completed", "cancelled"],
    completed: [],
    cancelled: [],
    suspended: ["published", "draft"],
  };

  static GLOBAL_TRANSITIONS = {
    suspended: ["*"],
    cancelled: ["*"],
  };

  /**
   * Factory method to create a new PurchaseRequest
   */
  static create(data, items, invitations, authContext) {
    if (!items || items.length === 0) {
      throw new DomainViolationException("Rule Violation: Cannot create a request without items.", "MISSING_ITEMS");
    }

    const pr = new PurchaseRequest({
      id: uuidv4(),
      version: 1,
      userId: authContext.actorId,
      sectorId: data.sectorId,
      status: "draft",
      title: data.title,
      description: data.description,
      deliveryLocations: data.deliveryLocations || [],
      requiresDelivery: data.requiresDelivery !== false,
      contactNumbers: data.contactNumbers || [],
      images: data.images || [],
      auction_type: data.auction_type || "public",
      items: items.map(i => ({ ...i, id: uuidv4() })),
      invitations: invitations || [],
      statusHistory: [{
        from: null,
        to: "draft",
        userId: authContext.actorId,
        userName: authContext.actorRole,
        reason: "Initial Creation",
        timestamp: new Date().toISOString()
      }]
    });

    pr.addEvent(new RequestCreatedEvent({
      aggregate: pr,
      authContext
    }));

    return pr;
  }

  static GLOBAL_TRANSITIONS = {
    suspended: ["*"],
    cancelled: ["*"],
  };

  canTransition(newStatus) {
    if (PurchaseRequest.GLOBAL_TRANSITIONS[newStatus]) return true;
    const allowed = PurchaseRequest.STATUS_TRANSITIONS[this.status];
    return allowed && allowed.includes(newStatus);
  }

  /**
   * Domain behavior: Publish the request
   * @param {boolean} publishAsRFQ 
   * @param {Object} authContext 
   * @returns {{ previousStatus: string, newStatus: string }}
   */
  publish(publishAsRFQ, authContext) {
    const targetStatus = publishAsRFQ ? "rfq_published" : "published";

    // 1. State Machine Validation
    if (!this.canTransition(targetStatus)) {
      if (authContext && authContext.actorRole === "seller") {
        throw new DomainViolationException("Illegal state transition attempt by seller", "MALICIOUS_ACTOR_SUSPENSION_REQUIRED");
      }
      throw new DomainViolationException(`Invalid Status Transition: ${this.status} -> ${targetStatus}`, "INVALID_TRANSITION");
    }

    // 2. Business Rules Validation
    if (targetStatus === "quoting") {
      if (this.status === "published" && (!authContext.quoteCount || authContext.quoteCount === 0)) {
        throw new DomainViolationException("Rule Violation: Cannot move to QUOTING without existing quotes.", "MISSING_PREREQUISITES");
      }
    }

    // 3. Mutate State
    const previousStatus = this.status;
    this.status = targetStatus;
    if (targetStatus === "rfq_published") {
      this.rfqStatus = "rfq_published";
    }

    this.statusHistory.push({
      from: previousStatus,
      to: targetStatus,
      userId: authContext.actorId || "system",
      userName: "Actor",
      reason: "State Transition",
      timestamp: new Date().toISOString(),
    });

    this.incrementVersion();

    // Domain Rule: The Aggregate manages its own events
    this.addEvent(new RequestPublishedEvent({
      aggregate: this,
      authContext: null
    }));

    return { previousStatus, newStatus: targetStatus };
  }

  /**
   * Domain behavior: Cancel the request
   * @param {string} reason 
   * @param {Object} authContext 
   */
  cancel(reason, authContext) {
    if (this.status === "completed" || this.status === "cancelled") {
      throw new DomainViolationException(`Cannot cancel a request in ${this.status} state.`, "INVALID_TRANSITION");
    }

    const previousStatus = this.status;
    this.status = "cancelled";
    this.rfqStatus = "cancelled";

    this.statusHistory.push({
      from: previousStatus,
      to: "cancelled",
      userId: authContext.actorId || "system",
      userName: authContext.actorRole || "Actor",
      reason: reason || "Cancelled by user",
      timestamp: new Date().toISOString(),
    });

    this.incrementVersion();
    return { previousStatus, newStatus: "cancelled" };
  }

  /**
   * Domain behavior: Award the request to a quote
   * @param {string} quoteId 
   * @param {Object} authContext 
   */
  award(quoteId, authContext) {
    if (!["quoting", "rfq_published", "published", "awaiting_decision"].includes(this.status)) {
      throw new DomainViolationException(`Cannot award a request in ${this.status} state.`, "INVALID_TRANSITION");
    }

    const previousStatus = this.status;
    this.status = "accepted";
    this.rfqStatus = "awarded";
    this.awardedQuoteId = quoteId;

    this.statusHistory.push({
      from: previousStatus,
      to: "accepted",
      userId: authContext.actorId || "system",
      userName: authContext.actorRole || "Actor",
      reason: `Awarded to quote ${quoteId}`,
      timestamp: new Date().toISOString(),
    });

    this.incrementVersion();
    return { previousStatus, newStatus: "accepted" };
  }
}

module.exports = PurchaseRequest;
