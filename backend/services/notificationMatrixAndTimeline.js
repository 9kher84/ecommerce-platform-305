/**
 * Notification Matrix & Audit Timeline Engine
 * Standardized notification routing table and Git-like audit timeline history for deals.
 */
class NotificationMatrixAndTimeline {
  static NOTIFICATION_MATRIX = {
    RFQ_CREATED: { recipients: ["ALL_SUPPLIERS_IN_CATEGORY"], channel: "IN_APP_AND_EMAIL" },
    QUOTE_SUBMITTED: { recipients: ["BUYER"], channel: "IN_APP" },
    NEGOTIATION_STARTED: { recipients: ["SELLER"], channel: "IN_APP_AND_WHATSAPP" },
    PRIMARY_SELECTED: { recipients: ["SELLER"], channel: "IN_APP_AND_WHATSAPP" },
    SUPPLIER_ACCEPTED: { recipients: ["BUYER"], channel: "IN_APP" },
    SHIPMENT_DISPATCHED: { recipients: ["BUYER"], channel: "IN_APP_AND_WHATSAPP" },
    RECEIPT_CONFIRMED: { recipients: ["SELLER", "BUYER"], channel: "IN_APP" },
    COMMISSION_INVOICE_GENERATED: { recipients: ["SELLER"], channel: "EMAIL" },
    ACCOUNT_SUSPENDED: { recipients: ["SELLER"], channel: "EMAIL_AND_WHATSAPP" }
  };

  /**
   * Dispatch notification according to Notification Matrix
   */
  static dispatchEventNotification(eventType, payload) {
    const config = this.NOTIFICATION_MATRIX[eventType] || { recipients: ["BUYER"], channel: "IN_APP" };
    return {
      dispatched: true,
      eventType,
      recipients: config.recipients,
      channel: config.channel,
      timestamp: new Date().toISOString(),
      payload
    };
  }

  /**
   * Generates Git-like Audit Timeline for a Deal
   */
  static generateGitLikeTimeline(dealEvents = []) {
    return dealEvents.map((evt, index) => ({
      commitId: `evt-${index + 1}-${Math.random().toString(36).substring(2, 8)}`,
      timestamp: evt.timestamp || new Date().toISOString(),
      action: evt.action || "DEAL_STATE_UPDATE",
      actor: evt.actor || "system",
      details: evt.details || "Deal state updated"
    }));
  }
}

module.exports = NotificationMatrixAndTimeline;
