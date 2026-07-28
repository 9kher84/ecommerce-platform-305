const AgentPlanner = require("../../services/agentPlanner");

describe("Agent Planner Engine Unit Suite (Phase C)", () => {
  const context = { userId: "user-planner-100", organizationId: "org-planner-100" };

  test("1. Should generate multi-step procurement plan for buy/rfq goal", async () => {
    const plan = await AgentPlanner.createPlan({
      goal: "أريد شراء 200 طن حديد لمشروع الرياض",
      context
    });

    expect(plan.status).toBe("PLANNED");
    expect(plan.steps.length).toBe(3);
    expect(plan.steps[0].toolName).toBe("SEARCH_SUPPLIER");
    expect(plan.steps[1].toolName).toBe("CREATE_RFQ");
    expect(plan.steps[2].toolName).toBe("PUBLISH_RFQ");
    expect(plan.requiresHumanApproval).toBe(false);
  });

  test("2. Should flag requiresHumanApproval = true when award approval is planned", async () => {
    const plan = await AgentPlanner.createPlan({
      goal: "اعتماد ترسية المنافسة رقم #402",
      context: { ...context, quoteId: "quote-402" }
    });

    expect(plan.status).toBe("PLANNED");
    expect(plan.requiresHumanApproval).toBe(true);
    const awardStep = plan.steps.find(s => s.toolName === "APPROVE_AWARD");
    expect(awardStep).toBeDefined();
    expect(awardStep.requiresApproval).toBe(true);
  });

  test("3. Should throw error if goal is missing", async () => {
    await expect(AgentPlanner.createPlan({ context }))
      .rejects.toThrow("Planner requires a valid 'goal' string.");
  });
});
