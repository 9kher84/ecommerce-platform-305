const { agentToolRegistry, AgentToolRegistry } = require("../../services/agentToolRegistry");
const { PurchaseRequest, Organization } = require("../../sequelize_setup");

describe("Agent Tool Registry Unit Suite (Phase B)", () => {
  const context = {
    userId: "user-tool-test-100",
    organizationId: "org-tool-test-100"
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  test("1. Should list all registered tools with required metadata", () => {
    const tools = agentToolRegistry.listTools();
    expect(tools.length).toBeGreaterThanOrEqual(5);
    
    const createRfqTool = tools.find(t => t.name === "CREATE_RFQ");
    expect(createRfqTool).toBeDefined();
    expect(createRfqTool.requiredPermission).toBe("CREATE_RFQ");
  });

  test("2. Should execute CREATE_RFQ tool successfully", async () => {
    jest.spyOn(PurchaseRequest, "create").mockResolvedValue({
      id: "pr-100",
      title: "Cement Order Project A",
      status: "OPEN"
    });

    const result = await agentToolRegistry.executeTool("CREATE_RFQ", {
      title: "Cement Order Project A",
      description: "500 Bags Cement"
    }, context);

    expect(result.success).toBe(true);
    expect(result.tool).toBe("CREATE_RFQ");
    expect(result.data.title).toBe("Cement Order Project A");
  });

  test("3. Should execute PUBLISH_RFQ tool successfully", async () => {
    const mockPR = { id: "pr-100", status: "OPEN", update: jest.fn().mockResolvedValue(true) };
    jest.spyOn(PurchaseRequest, "findByPk").mockResolvedValue(mockPR);

    const result = await agentToolRegistry.executeTool("PUBLISH_RFQ", { rfqId: "pr-100" }, context);

    expect(result.success).toBe(true);
    expect(result.tool).toBe("PUBLISH_RFQ");
    expect(mockPR.update).toHaveBeenCalledWith({ status: "PUBLISHED" });
  });

  test("4. Should throw error if required context (userId) is missing", async () => {
    await expect(
      agentToolRegistry.executeTool("CREATE_RFQ", { title: "Invalid Request" }, {})
    ).rejects.toThrow("Execution Context missing required 'userId'");
  });

  test("5. Should throw error when attempting to execute non-existent tool", async () => {
    await expect(
      agentToolRegistry.executeTool("UNKNOWN_TOOL", {}, context)
    ).rejects.toThrow("Tool 'UNKNOWN_TOOL' not found in Agent Tool Registry.");
  });
});
