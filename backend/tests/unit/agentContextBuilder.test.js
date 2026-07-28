const AgentContextBuilder = require("../../services/agentContextBuilder");
const {
  Organization,
  OrganizationMembership,
  MembershipPermission,
  OrganizationPolicy,
  SeparationOfDutiesRule
} = require("../../sequelize_setup");

describe("Agent Context Builder Unit Suite (Brain Layer)", () => {
  const userId = "user-ctx-test-100";
  const orgId = "org-ctx-test-100";
  const membershipId = "membership-ctx-test-100";

  beforeEach(() => {
    jest.clearAllMocks();
  });

  test("1. Should assemble complete Context Envelope with organization and user knowledge", async () => {
    jest.spyOn(Organization, "findByPk").mockResolvedValue({ id: orgId, name: "Saudi Construction Co" });
    jest.spyOn(OrganizationMembership, "findOne").mockResolvedValue({
      id: membershipId,
      role: "BUSINESS_MANAGER",
      isOwner: false,
      user: { id: userId, name: "Ahmed", email: "ahmed@test.com" },
      teams: [{ name: "Procurement Team" }]
    });
    jest.spyOn(MembershipPermission, "findAll").mockResolvedValue([
      { effect: "ALLOW", permission: { key: "CREATE_RFQ" } },
      { effect: "DENY", permission: { key: "APPROVE_AWARD" } }
    ]);
    jest.spyOn(OrganizationPolicy, "findAll").mockResolvedValue([{ id: "pol-1" }]);
    jest.spyOn(SeparationOfDutiesRule, "findAll").mockResolvedValue([{ ruleType: "CREATOR_NOT_APPROVER" }]);

    const envelope = await AgentContextBuilder.buildContext({
      userId,
      organizationId: orgId,
      channel: "WHATSAPP",
      prompt: "أريد شراء 200 طن حديد"
    });

    expect(envelope.channel).toBe("WHATSAPP");
    expect(envelope.organizationKnowledge.name).toBe("Saudi Construction Co");
    expect(envelope.userIdentityAndMemory.name).toBe("Ahmed");
    expect(envelope.permissionsAndLimits.allowedPermissions).toContain("CREATE_RFQ");
    expect(envelope.permissionsAndLimits.deniedPermissions).toContain("APPROVE_AWARD");
    expect(envelope.governanceAndPolicies.humanApprovalThreshold).toBe(20000);
  });

  test("2. Should throw error if userId or organizationId is missing", async () => {
    await expect(AgentContextBuilder.buildContext({ organizationId: orgId }))
      .rejects.toThrow("ContextBuilder requires both 'userId' and 'organizationId'.");
  });
});
