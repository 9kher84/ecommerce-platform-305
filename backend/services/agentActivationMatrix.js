/**
 * Agent Activation Matrix Service
 * Controls agent availability based on Organization ID, Subscription Tier, Environment, Rollout %, and Channel.
 */
class AgentActivationMatrix {
  constructor() {
    this.matrix = new Map();
  }

  /**
   * Evaluate if an agent is active for a given context
   * 
   * @param {Object} context
   * @param {string} context.agentId - Target Agent ID
   * @param {string} context.organizationId - Target Organization ID
   * @param {string} [context.tier='ENTERPRISE'] - Subscription Tier ('FREE' | 'PRO' | 'ENTERPRISE')
   * @param {string} [context.environment='PRODUCTION'] - Environment ('DEV' | 'STAGING' | 'PRODUCTION')
   * @param {string} [context.channel='WHATSAPP'] - Ingress Channel
   * @param {number} [context.rolloutPercentage=100] - Rollout percentage threshold
   */
  evaluateActivation(context) {
    const { agentId, tier = "ENTERPRISE", environment = "PRODUCTION", channel = "WHATSAPP", rolloutPercentage = 100 } = context;

    // 1. Tier Enforcement
    if (tier === "FREE" && agentId !== "agent-chief") {
      return { isAllowed: false, reason: "Agent requires PRO or ENTERPRISE subscription tier." };
    }

    // 2. Channel Enforcement
    const allowedChannels = ["WHATSAPP", "EMAIL", "TEAMS", "SLACK", "WEB"];
    if (!allowedChannels.includes(channel.toUpperCase())) {
      return { isAllowed: false, reason: `Channel '${channel}' is not supported.` };
    }

    // 3. Rollout Percentage Calculation
    if (rolloutPercentage < 100) {
      const hash = Math.abs(this.simpleHash(context.organizationId || "default")) % 100;
      if (hash >= rolloutPercentage) {
        return { isAllowed: false, reason: `Organization not included in current ${rolloutPercentage}% rollout cohort.` };
      }
    }

    return {
      isAllowed: true,
      agentId,
      tier,
      environment,
      channel,
      evaluatedAt: new Date().toISOString()
    };
  }

  simpleHash(str) {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      hash = (hash << 5) - hash + str.charCodeAt(i);
      hash |= 0;
    }
    return hash;
  }
}

const agentActivationMatrix = new AgentActivationMatrix();

module.exports = {
  AgentActivationMatrix,
  agentActivationMatrix
};
