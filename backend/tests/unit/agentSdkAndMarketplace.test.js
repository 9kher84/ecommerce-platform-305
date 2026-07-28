const BaseAgent = require("../../sdk/BaseAgent");
const { agentMarketplaceService } = require("../../services/agentMarketplaceService");

class SampleCustomAgent extends BaseAgent {
  constructor() {
    super({
      id: "agent-sample-custom",
      name: "Sample Custom Commercial Agent",
      version: "1.0.0",
      category: "PROCUREMENT",
      description: "Sample custom agent for unit testing BaseAgent SDK"
    });
  }

  async handleReasoning(context, prompt) {
    return { success: true, agent: this.manifest.name, reasoning: `Processed prompt: ${prompt}` };
  }
}

describe("Agent SDK & Agent Marketplace Unit Suite", () => {
  const orgId = "org-mkt-100";

  test("1. BaseAgent SDK: should create standardized custom agent and export manifest", async () => {
    const agent = new SampleCustomAgent();
    const manifest = agent.toManifest();

    expect(manifest.id).toBe("agent-sample-custom");
    expect(manifest.category).toBe("PROCUREMENT");

    const result = await agent.handleReasoning({}, "Test Prompt");
    expect(result.success).toBe(true);
  });

  test("2. Agent Marketplace Service: should retrieve catalog and filter by category", () => {
    const fullCatalog = agentMarketplaceService.getCatalog();
    expect(fullCatalog.length).toBeGreaterThan(0);

    const erpCatalog = agentMarketplaceService.getCatalog("ERP");
    expect(erpCatalog.length).toBe(1);
    expect(erpCatalog[0].id).toBe("agent-sap-erp");
  });

  test("3. Agent Marketplace Service: should install agent for organization", () => {
    const installRecord = agentMarketplaceService.installAgent(orgId, "agent-sap-erp");
    expect(installRecord.agentId).toBe("agent-sap-erp");
    expect(installRecord.status).toBe("ACTIVE");

    const installedList = agentMarketplaceService.getInstalledAgents(orgId);
    expect(installedList.length).toBe(1);
  });
});
