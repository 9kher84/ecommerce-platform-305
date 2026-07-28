const { agentActivationMatrix } = require("../../services/agentActivationMatrix");

describe("Agent Activation Matrix Unit Suite", () => {
  const orgId = "org-matrix-100";

  test("1. Should allow enterprise tier for specialized agents", () => {
    const result = agentActivationMatrix.evaluateActivation({
      agentId: "agent-commercial",
      organizationId: orgId,
      tier: "ENTERPRISE",
      channel: "WHATSAPP"
    });

    expect(result.isAllowed).toBe(true);
    expect(result.agentId).toBe("agent-commercial");
  });

  test("2. Should deny specialized agents for FREE subscription tier", () => {
    const result = agentActivationMatrix.evaluateActivation({
      agentId: "agent-commercial",
      organizationId: orgId,
      tier: "FREE",
      channel: "WHATSAPP"
    });

    expect(result.isAllowed).toBe(false);
    expect(result.reason).toContain("requires PRO or ENTERPRISE");
  });

  test("3. Should evaluate rollout percentage cohort filtering", () => {
    const result = agentActivationMatrix.evaluateActivation({
      agentId: "agent-chief",
      organizationId: orgId,
      tier: "PRO",
      channel: "EMAIL",
      rolloutPercentage: 100
    });

    expect(result.isAllowed).toBe(true);
  });
});
