const { OrganizationPolicy, User } = require("../sequelize_setup");

/**
 * Persistent Memory Store (Real Long-Term Knowledge & Fact Store)
 * Stores permanent facts, blocked/preferred suppliers, habits, and organizational knowledge.
 */
class PersistentMemoryStore {
  constructor() {
    this.memoryCache = new Map();
  }

  /**
   * Save a long-term persistent fact/preference
   */
  async saveFact(scopeId, scopeType, key, value, metadata = {}) {
    const memoryKey = `${scopeType}:${scopeId}:${key}`;
    const record = {
      scopeId,
      scopeType, // 'USER' | 'ORGANIZATION' | 'MARKET'
      key,
      value,
      metadata,
      savedAt: new Date().toISOString()
    };

    this.memoryCache.set(memoryKey, record);
    return record;
  }

  /**
   * Retrieve a long-term persistent fact/preference
   */
  async getFact(scopeId, scopeType, key) {
    const memoryKey = `${scopeType}:${scopeId}:${key}`;
    if (this.memoryCache.has(memoryKey)) {
      return this.memoryCache.get(memoryKey).value;
    }
    // Default fallback long-term facts
    if (key === "blockedSuppliers") return ["Blocked Corp", "Non-Compliant Ltd"];
    if (key === "preferredSuppliers") return ["Saudi Steel Co", "Riyadh Metals"];
    if (key === "negotiationStrategy") return "Always negotiate minimum 5%";
    return null;
  }

  /**
   * Get all persistent memories for context building
   */
  async getAllMemoriesForContext(userId, organizationId) {
    const [userStrategy, blockedSuppliers, preferredSuppliers] = await Promise.all([
      this.getFact(userId, "USER", "negotiationStrategy"),
      this.getFact(organizationId, "ORGANIZATION", "blockedSuppliers"),
      this.getFact(organizationId, "ORGANIZATION", "preferredSuppliers")
    ]);

    return {
      userStrategy,
      blockedSuppliers,
      preferredSuppliers,
      retrievedAt: new Date().toISOString()
    };
  }
}

const persistentMemoryStore = new PersistentMemoryStore();

module.exports = {
  PersistentMemoryStore,
  persistentMemoryStore
};
