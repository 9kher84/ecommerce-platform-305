const BusinessKnowledgeGraph = require("../../services/businessKnowledgeGraph");
const AutonomousOrganizationEngine = require("../../services/autonomousOrganizationEngine");
const { OrganizationMembership, MembershipPermission } = require("../../sequelize_setup");

describe("Business Knowledge Graph & Autonomous Organization Unit Suite", () => {
  const userId = "user-auto-100";
  const orgId = "org-auto-100";

  beforeEach(() => {
    jest.clearAllMocks();
  });

  test("1. Business Knowledge Graph: should build dynamic relational graph summary", async () => {
    const graph = await BusinessKnowledgeGraph.buildEnterpriseGraph(orgId);
    expect(graph.organizationId).toBe(orgId);
    expect(graph.graphSummary.totalNodes).toBeGreaterThan(0);
  });

  test("2. Autonomous Organization Engine: should run end-to-end lifecycle and pause at governance gate", async () => {
    jest.spyOn(OrganizationMembership, "findOne").mockResolvedValue({ id: "mem-auto-100", isOwner: true });
    jest.spyOn(MembershipPermission, "findAll").mockResolvedValue([
      { effect: "ALLOW", permission: { key: "CREATE_RFQ" } }
    ]);

    const result = await AutonomousOrganizationEngine.runAutonomousLifecycle({
      userId,
      organizationId: orgId,
      channel: "WHATSAPP",
      prompt: "أريد توريد 500 طن حديد لمشروع الرياض"
    });

    expect(result.success).toBe(true);
    expect(result.status).toBe("PAUSED_AT_HUMAN_GOVERNANCE_GATE");
    expect(result.workflow.steps.length).toBe(3);
  });
});
