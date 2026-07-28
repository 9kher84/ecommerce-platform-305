/**
 * Agent Lifecycle Manager (State Machine Engine)
 * Manages full lifecycle states for digital employees:
 * INSTALLED -> CONFIGURED -> DISABLED -> SLEEPING -> RUNNING -> PAUSED -> MAINTENANCE -> RETIRED
 */
class AgentLifecycleManager {
  constructor() {
    this.agentStates = new Map();
    this.validStates = [
      "INSTALLED", "CONFIGURED", "DISABLED", "SLEEPING", 
      "RUNNING", "PAUSED", "MAINTENANCE", "RETIRED"
    ];
  }

  /**
   * Set agent state with transition validation
   */
  setAgentState(agentId, newState, reason = "") {
    if (!this.validStates.includes(newState)) {
      throw new Error(`Invalid state '${newState}'. Allowed states: ${this.validStates.join(", ")}`);
    }

    const previousState = this.agentStates.get(agentId)?.status || "UNINITIALIZED";
    const record = {
      agentId,
      status: newState,
      previousState,
      updatedAt: new Date().toISOString(),
      reason
    };

    this.agentStates.set(agentId, record);
    return record;
  }

  /**
   * Get current state of an agent
   */
  getAgentState(agentId) {
    return this.agentStates.get(agentId) || { agentId, status: "RUNNING", updatedAt: new Date().toISOString() };
  }

  /**
   * List all agent states
   */
  listAllAgentStates() {
    return Array.from(this.agentStates.values());
  }
}

const agentLifecycleManager = new AgentLifecycleManager();

module.exports = {
  AgentLifecycleManager,
  agentLifecycleManager
};
