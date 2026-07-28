const AgentContextBuilder = require("../services/agentContextBuilder");
const AgentPlanner = require("../services/agentPlanner");
const AgentRuntime = require("../services/agentRuntime");
const LLMAdapter = require("../services/llmAdapter");
const { agentConversationEngine } = require("../services/agentConversationEngine");

/**
 * Agent Gateway Controller
 * End-to-end API gateway orchestrating ContextBuilder -> LLMAdapter -> AgentPlanner -> AgentRuntime
 */
exports.handleAgentChat = async (req, res) => {
  try {
    const { message, sessionId, channel = "WEB" } = req.body;
    const userId = req.user?.id || "user-agent-guest";
    const organizationId = req.headers["x-organization-id"] || req.user?.organizationId || "00000000-0000-0000-0000-000000000000";

    if (!message) {
      return res.status(400).json({ error: "Message is required" });
    }

    const activeSessionId = sessionId || `session-${userId}-${Date.now()}`;
    agentConversationEngine.getOrCreateSession(activeSessionId, { userId, organizationId, channel });
    agentConversationEngine.appendMessage(activeSessionId, "USER", message);

    // 1. Context Builder
    const contextEnvelope = await AgentContextBuilder.buildContext({
      userId,
      organizationId,
      channel,
      prompt: message
    }).catch(() => ({
      organizationKnowledge: { name: "شركة الإعمار الذهبي" },
      userIdentityAndMemory: { name: req.user?.name || "المستخدم" },
      permissionsAndLimits: { allowedPermissions: ["CREATE_RFQ", "PUBLISH_RFQ"] }
    }));

    // 2. LLM Reasoning
    const llmResponse = await LLMAdapter.complete({
      systemPrompt: `You are Chief Personal Agent for ${contextEnvelope.userIdentityAndMemory.name}`,
      userPrompt: message
    });

    // 3. Planner
    const plan = await AgentPlanner.createPlan({
      goal: message,
      context: { userId, organizationId }
    });

    // 4. Agent Runtime Execution
    const runtimeResult = await AgentRuntime.execute({
      channel,
      userId,
      organizationId,
      intent: plan.steps[0]?.toolName || "SEARCH_SUPPLIER",
      data: { prompt: message }
    });

    const agentReply = `الوكيل الذكي: ${llmResponse.response} (حالة الخطة: ${runtimeResult.status})`;
    agentConversationEngine.appendMessage(activeSessionId, "AGENT", agentReply, { plan, runtimeResult });

    return res.json({
      success: true,
      sessionId: activeSessionId,
      reply: agentReply,
      llmReasoning: llmResponse,
      executionPlan: plan,
      runtimeResult
    });
  } catch (error) {
    console.error("Agent Gateway Error:", error);
    return res.status(500).json({ error: "Agent Gateway Execution Failed", details: error.message });
  }
};
