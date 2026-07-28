const { agentOrchestrator } = require("../../services/agentOrchestrator");
const { OrganizationMembership, MembershipPermission } = require("../../sequelize_setup");

describe("Agent Orchestrator Unit Suite (Multi-Agent Collaboration)", () => {
  const payload = {
    userId: "user-orch-100",
    organizationId: "org-orch-100",
    channel: "WHATSAPP",
    message: "أريد شراء 500 طن حديد لمشروع الرياض"
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  test("1. Should route procurement intent to Commercial Procurement Agent", () => {
    const agent = agentOrchestrator.routeAgent("CREATE_RFQ");
    expect(agent.name).toBe("Commercial Procurement Agent");
  });

  test("2. Should route finance intent to Finance & Invoice Agent", () => {
    const agent = agentOrchestrator.routeAgent("CREATE_INVOICE");
    expect(agent.name).toBe("Finance & Invoice Agent");
  });

  test("3. Should orchestrate full multi-agent collaboration sequence", async () => {
    jest.spyOn(OrganizationMembership, "findOne").mockResolvedValue({ id: "membership-orch-100", isOwner: true });
    jest.spyOn(MembershipPermission, "findAll").mockResolvedValue([
      { effect: "ALLOW", permission: { key: "CREATE_RFQ" } }
    ]);

    const result = await agentOrchestrator.orchestrate(payload);

    expect(result.success).toBe(true);
    expect(result.orchestrator.assignedAgent).toBe("Commercial Procurement Agent");
    expect(result.orchestrator.collaborationTrail.length).toBe(3);
    expect(result.runtimeResult.status).toBe("EXECUTED");
  });
});
