/**
 * Deal Lifecycle Orchestration Service
 * Connects RFQ Ingress -> Negotiation -> Awarding -> Seller Confirmation -> Invoice -> Fulfillment -> Commission -> Reputation -> Close.
 */
class DealLifecycleService {
  static FULL_JOURNEY_STAGES = [
    "BUYER_PUBLISH_RFQ",
    "SUPPLIERS_RECEIVE_NOTIFICATION",
    "SUPPLIER_SUBMITS_QUOTE",
    "NEGOTIATION_LOOP",
    "MORE_QUOTES_ALLOWED",
    "BUYER_CHOOSES_PRIMARY_AND_BACKUPS",
    "SELLER_ACCEPTANCE_GATE",
    "INVOICE_GENERATED_AND_UNMASKED",
    "PREPARING_ORDER",
    "SHIPPED",
    "DELIVERED",
    "BUYER_CONFIRMATION",
    "COMMISSION_CALCULATED",
    "REPUTATION_UPDATED",
    "PORTFOLIO_UPDATED",
    "DEAL_CLOSED"
  ];

  /**
   * Evaluates deal progress along the official MarketHub journey map
   */
  static getJourneyProgress(currentStage) {
    const index = this.FULL_JOURNEY_STAGES.indexOf(currentStage);
    const progressPercent = index >= 0 ? Math.round(((index + 1) / this.FULL_JOURNEY_STAGES.length) * 100) : 0;

    return {
      currentStage,
      stageIndex: index + 1,
      totalStages: this.FULL_JOURNEY_STAGES.length,
      progressPercent,
      isCompleted: currentStage === "DEAL_CLOSED"
    };
  }
}

module.exports = DealLifecycleService;
