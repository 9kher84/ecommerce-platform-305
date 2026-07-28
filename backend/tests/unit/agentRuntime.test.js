const AgentRuntime = require("../../services/agentRuntime");
const {
  OrganizationMembership,
  MembershipPermission,
  Permission
} = require("../../sequelize_setup");

describe("Agent Runtime Core Unit Suite", () => {
  const userId = "user-agent-test-100";
  const orgId = "org-agent-test-100";
  const membershipId = "membership-agent-test-100";

  beforeEach(() => {
    jest.clearAllMocks();
  });

  test("1. Should fail if active membership is not found", async () => {
    jest.spyOn(OrganizationMembership, "findOne").mockResolvedValue(null);

    const result = await AgentRuntime.execute({
      channel: "WHATSAPP",
      userId,
      organizationId: orgId,
      intent: "CREATE_RFQ",
      data: {}
    });

    expect(result.success).toBe(false);
    expect(result.code).toBe("MEMBERSHIP_NOT_FOUND");
  });

  test("2. Should fail if explicit DENY permission is present", async () => {
    jest.spyOn(OrganizationMembership, "findOne").mockResolvedValue({ id: membershipId, isOwner: false });
    jest.spyOn(MembershipPermission, "findAll").mockResolvedValue([
      { effect: "DENY", permission: { key: "CREATE_RFQ" } }
    ]);

    const result = await AgentRuntime.execute({
      channel: "EMAIL",
      userId,
      organizationId: orgId,
      intent: "CREATE_RFQ",
      data: {}
    });

    expect(result.success).toBe(false);
    expect(result.code).toBe("EXPLICIT_DENY");
  });

  test("3. Should fail on Separation of Duties (SoD) violation (Creator = Approver)", async () => {
    jest.spyOn(OrganizationMembership, "findOne").mockResolvedValue({ id: membershipId, isOwner: false });
    jest.spyOn(MembershipPermission, "findAll").mockResolvedValue([
      { effect: "ALLOW", permission: { key: "APPROVE_AWARD" } }
    ]);

    const result = await AgentRuntime.execute({
      channel: "TEAMS",
      userId,
      organizationId: orgId,
      intent: "APPROVE_AWARD",
      data: { creatorId: userId } // Creator trying to approve own award
    });

    expect(result.success).toBe(false);
    expect(result.code).toBe("SOD_VIOLATION");
  });

  test("4. Should require human approval if amount exceeds autonomous authority threshold", async () => {
    jest.spyOn(OrganizationMembership, "findOne").mockResolvedValue({ id: membershipId, isOwner: false });
    jest.spyOn(MembershipPermission, "findAll").mockResolvedValue([
      { effect: "ALLOW", permission: { key: "APPROVE_AWARD" } }
    ]);

    const result = await AgentRuntime.execute({
      channel: "WHATSAPP",
      userId,
      organizationId: orgId,
      intent: "APPROVE_AWARD",
      data: { creatorId: "other-user-id", amount: 1000000 } // Exceeds SAR 500,000 threshold
    });

    expect(result.success).toBe(true);
    expect(result.status).toBe("PENDING_APPROVAL");
  });

  test("5. Should execute successfully when all policies and permissions pass", async () => {
    jest.spyOn(OrganizationMembership, "findOne").mockResolvedValue({ id: membershipId, isOwner: false });
    jest.spyOn(MembershipPermission, "findAll").mockResolvedValue([
      { effect: "ALLOW", permission: { key: "CREATE_RFQ" } }
    ]);

    const result = await AgentRuntime.execute({
      channel: "WHATSAPP",
      userId,
      organizationId: orgId,
      intent: "CREATE_RFQ",
      data: { amount: 50000 }
    });

    expect(result.success).toBe(true);
    expect(result.status).toBe("EXECUTED");
    expect(result.executionPlan.steps.length).toBeGreaterThan(0);
  });
});
