const { subscribe, emitOperationalEvent } = require("../utils/EventBus");
const { commercialTimelineEngine } = require("./commercialTimelineEngine");
const DynamicCommissionEngine = require("./dynamicCommissionEngine");
const BlindExchangeService = require("./blindExchangeService");
const NotificationMatrixAndTimeline = require("./notificationMatrixAndTimeline");

/**
 * Commercial Event Bus Orchestrator
 * Fans out core commercial events reactively across Notification, Timeline, Analytics, Commission, Portfolio, and Reputation modules.
 */
class CommercialEventBusOrchestrator {
  constructor() {
    this.isInitialized = false;
  }

  /**
   * Register reactive listeners across all commercial domains
   */
  init() {
    if (this.isInitialized) return;

    // 1. RFQ_CREATED Event Listener
    subscribe("RFQ_CREATED", async (event) => {
      commercialTimelineEngine.logCommit(event.aggregateId, event.actor.id, "RFQ_CREATED", event.payload);
      NotificationMatrixAndTimeline.dispatchEventNotification("RFQ_CREATED", event.payload);
    });

    // 2. QUOTE_SUBMITTED Event Listener
    subscribe("QUOTE_SUBMITTED", async (event) => {
      commercialTimelineEngine.logCommit(event.aggregateId, event.actor.id, "QUOTE_SUBMITTED", event.payload);
      NotificationMatrixAndTimeline.dispatchEventNotification("QUOTE_SUBMITTED", event.payload);
      BlindExchangeService.recordReputationSignal(event.actor.id, "QUOTE_SUBMITTED", event.payload);
    });

    // 3. SELLER_ACCEPTED Event Listener
    subscribe("SELLER_ACCEPTED", async (event) => {
      commercialTimelineEngine.logCommit(event.aggregateId, event.actor.id, "SELLER_ACCEPTED", event.payload);
      NotificationMatrixAndTimeline.dispatchEventNotification("SUPPLIER_ACCEPTED", event.payload);
    });

    // 4. DELIVERY_CONFIRMED Event Listener
    subscribe("DELIVERY_CONFIRMED", async (event) => {
      commercialTimelineEngine.logCommit(event.aggregateId, event.actor.id, "DELIVERY_CONFIRMED", event.payload);
      NotificationMatrixAndTimeline.dispatchEventNotification("RECEIPT_CONFIRMED", event.payload);
      
      // Calculate dynamic commission reactively
      if (event.payload && event.payload.dealAmountSAR) {
        DynamicCommissionEngine.calculateDynamicCommission({
          dealAmountSAR: event.payload.dealAmountSAR,
          reputationScore: 4.8
        });
      }

      // Record reputation & portfolio update reactively
      BlindExchangeService.recordReputationSignal(event.actor.id, "SALE_COMPLETED", event.payload);
    });

    this.isInitialized = true;
    console.log("⚡ Commercial Event Bus Orchestrator Initialized & Bound to Event Topics.");
  }

  /**
   * Helper method to publish a commercial event
   */
  publishCommercialEvent(eventType, aggregateType, aggregateId, actorType, actorId, payload) {
    emitOperationalEvent(eventType, aggregateType, aggregateId, actorType, actorId, payload);
    return { published: true, eventType, aggregateId, timestamp: new Date().toISOString() };
  }
}

const commercialEventBus = new CommercialEventBusOrchestrator();
commercialEventBus.init();

module.exports = {
  CommercialEventBusOrchestrator,
  commercialEventBus
};
