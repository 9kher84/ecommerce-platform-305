const AgentReasoningEngine = require("../../services/agentReasoningEngine");
const { Organization, OrganizationMembership, MembershipPermission, OrganizationPolicy, SeparationOfDutiesRule } = require("../../sequelize_setup");

describe("Agent Reasoning Engine Unit Suite (Thinking & Self-Critique)", () => {
  const userId = "user-reason-100";
  const orgId = "org-reason-100";

  beforeEach(() => {
    jest.clearAllMocks();
  });

  test("1. Should run complete thinking, self-critique, and reflection pipeline", async () => {
    jest.spyOn(Organization, "findByPk").mockResolvedValue({ id: orgId, name: "Saudi Construction Co" });
    jest.spyOn(OrganizationMembership, "findOne").mockResolvedValue({
      id: "mem-reason-100",
      isOwner: true,
      role: "BUSINESS_MANAGER",
      user: { id: userId, name: "Ahmed", email: "ahmed@test.com" },
      teams: [{ name: "Procurement Team" }]
    });
    jest.spyOn(MembershipPermission, "findAll").mockResolvedValue([
      { effect: "ALLOW", permission: { key: "CREATE_RFQ" } }
    ]);
    jest.spyOn(OrganizationPolicy, "findAll").mockResolvedValue([]);
    jest.spyOn(SeparationOfDutiesRule, "findAll").mockResolvedValue([]);

    const result = await AgentReasoningEngine.thinkAndExecute({
      userId,
      organizationId: orgId,
      channel: "WHATSAPP",
      message: "أريد توريد خرسانة جاهزة لمشروع جدة"
    });

    expect(result.success).toBe(true);
    expect(result.reasoningPipeline.intent).toBe("CREATE_RFQ");
    expect(result.reasoningPipeline.reasoningHypothesis.selfCritique.length).toBeGreaterThan(0);
    expect(result.reasoningPipeline.reflection.outcome).toBe("SUCCESS");
    expect(result.runtimeResult.status).toBe("EXECUTED");
  });

  test("2. Should throw error if userId, organizationId, or message is missing", async () => {
    await expect(AgentReasoningEngine.thinkAndExecute({ userId, organizationId: orgId }))
      .rejects.toThrow("ReasoningEngine requires userId, organizationId, and message.");
  });
});
