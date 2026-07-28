const { persistentMemoryStore } = require("../../services/persistentMemoryStore");
const { agentWorkflowEngine } = require("../../services/agentWorkflowEngine");
const { agentEventBus } = require("../../services/agentEventBus");
const { OrganizationMembership, MembershipPermission } = require("../../sequelize_setup");

describe("Persistent Memory, Workflow Engine & Event Bus Unit Suite", () => {
  const userId = "user-wf-100";
  const orgId = "org-wf-100";

  beforeEach(() => {
    jest.clearAllMocks();
  });

  test("1. Persistent Memory Store: should save and retrieve long-term facts", async () => {
    await persistentMemoryStore.saveFact(orgId, "ORGANIZATION", "negotiationStrategy", "Always negotiate 7%");
    const fact = await persistentMemoryStore.getFact(orgId, "ORGANIZATION", "negotiationStrategy");
    expect(fact).toBe("Always negotiate 7%");
  });

  test("2. Agent Workflow Engine: should create and advance multi-step workflows", async () => {
    jest.spyOn(OrganizationMembership, "findOne").mockResolvedValue({ id: "mem-wf-100", isOwner: true });
    jest.spyOn(MembershipPermission, "findAll").mockResolvedValue([
      { effect: "ALLOW", permission: { key: "SEARCH_SUPPLIER" } }
    ]);

    const wf = agentWorkflowEngine.createWorkflow({
      title: "Steel Procurement Workflow",
      userId,
      organizationId: orgId,
      steps: [
        { name: "Search Suppliers", intent: "SEARCH_SUPPLIER" },
        { name: "Create RFQ", intent: "CREATE_RFQ" }
      ]
    });

    expect(wf.status).toBe("IN_PROGRESS");
    expect(wf.steps.length).toBe(2);

    const advanceResult = await agentWorkflowEngine.advanceWorkflow(wf.id);
    expect(advanceResult.success).toBe(true);
    expect(advanceResult.workflow.steps[0].status).toBe("COMPLETED");
  });

  test("3. Agent Event Bus: should emit events and trigger autonomous reactions", async () => {
    jest.spyOn(OrganizationMembership, "findOne").mockResolvedValue({ id: "mem-wf-100", isOwner: true });
    jest.spyOn(MembershipPermission, "findAll").mockResolvedValue([
      { effect: "ALLOW", permission: { key: "SEARCH_SUPPLIER" } }
    ]);

    let handlerCalled = false;
    agentEventBus.subscribe("QUOTE_RECEIVED", async (payload) => {
      handlerCalled = true;
      return { handled: true };
    });

    const res = await agentEventBus.emit("QUOTE_RECEIVED", { userId, organizationId: orgId, quoteId: "q-100" });
    expect(handlerCalled).toBe(true);
    expect(res.eventName).toBe("QUOTE_RECEIVED");
    expect(res.reactionsCount).toBeGreaterThan(0);
  });
});
