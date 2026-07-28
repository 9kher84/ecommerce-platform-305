const { agentOrchestrator } = require("./agentOrchestrator");

/**
 * Agent Event Bus (Reactive Autonomous Event Engine)
 * Listens for system domain events (QuoteReceived, InvoiceSubmitted, SupplierBlocked, TenderClosed)
 * and autonomously triggers agent evaluation without human prompting!
 */
class AgentEventBus {
  constructor() {
    this.listeners = new Map();
  }

  /**
   * Subscribe an agent listener to a domain event
   */
  subscribe(eventName, handler) {
    if (!this.listeners.has(eventName)) {
      this.listeners.set(eventName, []);
    }
    this.listeners.get(eventName).push(handler);
  }

  /**
   * Emit a domain event and trigger autonomous agent reactions
   */
  async emit(eventName, eventPayload) {
    const handlers = this.listeners.get(eventName) || [];
    const eventTime = new Date().toISOString();

    const reactions = [];
    for (const handler of handlers) {
      const result = await handler(eventPayload);
      reactions.push(result);
    }

    // Default autonomous orchestrator trigger for core events
    if (eventName === "QUOTE_RECEIVED" || eventName === "INVOICE_SUBMITTED") {
      const orchResult = await agentOrchestrator.orchestrate({
        userId: eventPayload.userId || "00000000-0000-0000-0000-000000000000",
        organizationId: eventPayload.organizationId || "00000000-0000-0000-0000-000000000000",
        channel: "EVENT_BUS",
        message: `Autonomous Event Reaction: ${eventName}`
      });
      reactions.push(orchResult);
    }

    return {
      eventName,
      eventTime,
      reactionsCount: reactions.length,
      reactions
    };
  }
}

const agentEventBus = new AgentEventBus();

module.exports = {
  AgentEventBus,
  agentEventBus
};
