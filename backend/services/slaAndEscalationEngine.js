/**
 * SLA & Escalation Engine
 * Handles Quote expiration SLAs, Shipment SLA breaches, and MIA escalation rules.
 */
class SlaAndEscalationEngine {
  /**
   * Evaluates Quote SLA Expiration
   */
  static checkQuoteSla(quoteData) {
    const createdAt = new Date(quoteData.createdAt || Date.now());
    const validUntil = new Date(quoteData.validUntil || createdAt.getTime() + 48 * 3600 * 1000); // Default 48h SLA
    const now = new Date();

    const isExpired = now > validUntil;
    const hoursRemaining = Math.max(0, Math.round((validUntil - now) / (1000 * 3600)));

    return {
      quoteId: quoteData.id,
      isExpired,
      hoursRemaining,
      status: isExpired ? "EXPIRED" : hoursRemaining <= 6 ? "WARNING_EXPIRING_SOON" : "ACTIVE_SLA"
    };
  }

  /**
   * Handles MIA Escalation if party vanishes during negotiation/fulfillment
   */
  static handleMiaEscalation(dealId, lastActivityDate, MIA_HOURS_THRESHOLD = 72) {
    const lastActive = new Date(lastActivityDate || Date.now());
    const hoursInactive = Math.round((new Date() - lastActive) / (1000 * 3600));
    const isMia = hoursInactive >= MIA_HOURS_THRESHOLD;

    return {
      dealId,
      hoursInactive,
      isMia,
      action: isMia ? "TRIGGER_AUTO_CANCEL_OR_CASCADE" : "SEND_REMINDER_NOTIFICATION",
      message: isMia ? `Party MIA for ${hoursInactive}h. Escalating deal for auto-cancellation/cascade.` : `Reminder sent.`
    };
  }
}

module.exports = SlaAndEscalationEngine;
