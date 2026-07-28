/**
 * Agent Memory Engine
 * Layered memory store for facts, preferences, summaries, and long-term organizational knowledge.
 */
class AgentMemoryEngine {
  constructor() {
    this.personalMemories = new Map();
    this.organizationMemories = new Map();
  }

  /**
   * Store personal user preference memory
   */
  rememberPersonalPreference(userId, key, value) {
    if (!this.personalMemories.has(userId)) {
      this.personalMemories.set(userId, new Map());
    }
    this.personalMemories.get(userId).set(key, {
      value,
      updatedAt: new Date().toISOString()
    });
  }

  /**
   * Get personal user preference memory
   */
  getPersonalPreferences(userId) {
    const memories = this.personalMemories.get(userId);
    if (!memories) return { negotiationStrategy: "Prioritize Quality & Speed", maxAutonomousApprovalLimit: 20000 };
    const obj = {};
    for (let [k, v] of memories.entries()) {
      obj[k] = v.value;
    }
    return obj;
  }

  /**
   * Store organization memory (e.g. blocked/preferred suppliers)
   */
  rememberOrganizationFact(orgId, key, value) {
    if (!this.organizationMemories.has(orgId)) {
      this.organizationMemories.set(orgId, new Map());
    }
    this.organizationMemories.get(orgId).set(key, {
      value,
      updatedAt: new Date().toISOString()
    });
  }

  /**
   * Get organization memory facts
   */
  getOrganizationFacts(orgId) {
    const memories = this.organizationMemories.get(orgId);
    if (!memories) return { preferredSuppliers: ["ABC Steel"], blockedSuppliers: ["Blocked Corp"] };
    const obj = {};
    for (let [k, v] of memories.entries()) {
      obj[k] = v.value;
    }
    return obj;
  }
}

const agentMemoryEngine = new AgentMemoryEngine();

module.exports = {
  AgentMemoryEngine,
  agentMemoryEngine
};
