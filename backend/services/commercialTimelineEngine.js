/**
 * Commercial Timeline Engine
 * Append-only Git-like timeline engine recording exact timestamps for every state update
 * from RFQ Creation to Deal Closure.
 */
class CommercialTimelineEngine {
  constructor() {
    this.timelines = new Map();
  }

  /**
   * Log an immutable timeline commit event
   */
  logCommit(dealId, actor, action, details = {}) {
    if (!this.timelines.has(dealId)) {
      this.timelines.set(dealId, []);
    }

    const events = this.timelines.get(dealId);
    const commit = {
      commitHash: `c-${events.length + 1}-${Math.random().toString(36).substring(2, 9)}`,
      timestamp: new Date().toISOString(),
      actor,
      action,
      details
    };

    events.push(commit);
    return commit;
  }

  /**
   * Get full audit timeline history for a Deal
   */
  getTimelineHistory(dealId) {
    return this.timelines.get(dealId) || [];
  }
}

const commercialTimelineEngine = new CommercialTimelineEngine();

module.exports = {
  CommercialTimelineEngine,
  commercialTimelineEngine
};
