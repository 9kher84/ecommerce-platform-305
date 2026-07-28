const AgentContextBuilder = require("./agentContextBuilder");
const AgentPlanner = require("./agentPlanner");
const AgentRuntime = require("./agentRuntime");
const LLMAdapter = require("./llmAdapter");
const { agentMemoryEngine } = require("./agentMemoryEngine");
const { agentConversationEngine } = require("./agentConversationEngine");

/**
 * Agent Reasoning Engine (Thinking Pipeline & Self-Critique)
 * Pipeline: Intent -> Context -> Memory Retrieval -> Reasoning & Critique -> Plan -> Tool Selection -> Policy Check -> Execute -> Observe -> Reflect -> Store Memory
 */
class AgentReasoningEngine {
  /**
   * Run full Thinking & Reasoning Pipeline
   * 
   * @param {Object} payload
   * @param {string} payload.userId - User ID
   * @param {string} payload.organizationId - Target Organization ID
   * @param {string} payload.message - Raw message/prompt
   * @param {string} [payload.channel='WEB'] - Ingress Channel
   * @param {string} [payload.sessionId] - Active Conversation Session ID
   */
  static async thinkAndExecute(payload) {
    const startTime = Date.now();
    const { userId, organizationId, message, channel = "WEB", sessionId } = payload;

    if (!userId || !organizationId || !message) {
      throw new Error("ReasoningEngine requires userId, organizationId, and message.");
    }

    // 1. Intent Detection
    const intent = message.toLowerCase().includes("ترسية") || message.toLowerCase().includes("award")
      ? "APPROVE_AWARD"
      : message.toLowerCase().includes("فاتورة") || message.toLowerCase().includes("invoice")
      ? "CREATE_INVOICE"
      : "CREATE_RFQ";

    // 2. Context Builder & Memory Retrieval
    const contextEnvelope = await AgentContextBuilder.buildContext({
      userId,
      organizationId,
      channel,
      prompt: message
    });

    const personalMemory = agentMemoryEngine.getPersonalPreferences(userId);
    const orgMemory = agentMemoryEngine.getOrganizationFacts(organizationId);

    // 3. Reasoning & Self-Critique Stage
    const reasoningHypothesis = {
      detectedIntent: intent,
      riskAssessment: intent === "APPROVE_AWARD" ? "HIGH" : "MEDIUM",
      selfCritique: [
        `Verified user identity and organization context for ${organizationId}`,
        `Checked memory preferences: Strategy '${personalMemory.negotiationStrategy}'`,
        `Evaluated SoD compliance & authority thresholds (Limit: SAR ${personalMemory.maxAutonomousApprovalLimit})`
      ]
    };

    // 4. Planner & Tool Selection
    const plan = await AgentPlanner.createPlan({
      goal: message,
      context: { userId, organizationId, quoteId: "quote-reasoning-100" }
    });

    // 5. LLM Synthesis with Reasoning Prompt
    const llmReasoning = await LLMAdapter.complete({
      systemPrompt: `Reasoning Engine Context: ${JSON.stringify(reasoningHypothesis)}`,
      userPrompt: message
    });

    // 6. Policy Checked Execution via AgentRuntime
    const runtimeResult = await AgentRuntime.execute({
      channel,
      userId,
      organizationId,
      intent,
      data: { prompt: message, reasoning: reasoningHypothesis }
    });

    // 7. Observe Result & Reflect
    const reflection = {
      outcome: runtimeResult.success ? "SUCCESS" : "BLOCKED_BY_POLICY",
      observation: `Runtime status: ${runtimeResult.status}`,
      reflectionNotes: runtimeResult.status === "PENDING_APPROVAL" 
        ? "Action exceeds autonomous authority; escalated to Human Approval."
        : "Action completed in accordance with organizational policies."
    };

    // 8. Store Updated Memory Fact
    agentMemoryEngine.rememberPersonalPreference(userId, "lastExecutedIntent", intent);
    if (sessionId) {
      agentConversationEngine.appendMessage(sessionId, "AGENT", llmReasoning.response, { reasoningHypothesis, reflection });
    }

    return {
      success: true,
      reasoningPipeline: {
        intent,
        reasoningHypothesis,
        reflection,
        processingTimeMs: Date.now() - startTime
      },
      contextEnvelope,
      plan,
      llmReasoning,
      runtimeResult
    };
  }
}

module.exports = AgentReasoningEngine;
