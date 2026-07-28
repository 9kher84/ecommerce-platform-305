const { agentConversationEngine } = require("../../services/agentConversationEngine");
const { agentMemoryEngine } = require("../../services/agentMemoryEngine");
const LLMAdapter = require("../../services/llmAdapter");

describe("Agent Conversation, Memory & LLM Adapter Unit Suite", () => {
  const sessionId = `test-session-${Date.now()}`;
  const userId = "user-conv-100";
  const orgId = "org-conv-100";

  test("1. Conversation Engine: should create session and append messages", () => {
    const session = agentConversationEngine.getOrCreateSession(sessionId, { userId, organizationId: orgId, channel: "WHATSAPP" });
    expect(session.id).toBe(sessionId);

    const msg = agentConversationEngine.appendMessage(sessionId, "USER", "أريد شراء حديد");
    expect(msg.content).toBe("أريد شراء حديد");

    const history = agentConversationEngine.getHistory(sessionId);
    expect(history.length).toBe(1);
  });

  test("2. Memory Engine: should remember personal and organizational preferences", () => {
    agentMemoryEngine.rememberPersonalPreference(userId, "maxAutonomousApprovalLimit", 50000);
    const prefs = agentMemoryEngine.getPersonalPreferences(userId);
    expect(prefs.maxAutonomousApprovalLimit).toBe(50000);

    agentMemoryEngine.rememberOrganizationFact(orgId, "preferredSuppliers", ["Steel Global Co"]);
    const facts = agentMemoryEngine.getOrganizationFacts(orgId);
    expect(facts.preferredSuppliers).toContain("Steel Global Co");
  });

  test("3. LLM Adapter: should decouple provider and return structured completion", async () => {
    const res = await LLMAdapter.complete({
      systemPrompt: "You are Agent",
      userPrompt: "Testing prompt",
      provider: "OPENAI"
    });

    expect(res.provider).toBe("OPENAI");
    expect(res.response).toBeDefined();
    expect(res.usage.totalTokens).toBeGreaterThan(0);
  });
});
