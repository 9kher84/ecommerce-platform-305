const { agentToolRegistry } = require("./agentToolRegistry");

/**
 * Agent Planner Engine (Phase C)
 * Analyzes intent/goals and formulates structured, sequenced Execution Plans using registered tools.
 */
class AgentPlanner {
  /**
   * Create an execution plan for a given user goal/prompt
   * 
   * @param {Object} payload
   * @param {string} payload.goal - User intent/goal
   * @param {Object} payload.context - User & Org context
   */
  static async createPlan(payload) {
    const { goal, context } = payload;

    if (!goal) {
      throw new Error("Planner requires a valid 'goal' string.");
    }

    const availableTools = agentToolRegistry.listTools();

    const plan = {
      goal,
      plannedAt: new Date().toISOString(),
      status: "PLANNED",
      requiresHumanApproval: false,
      steps: []
    };

    const goalLower = goal.toLowerCase();

    // Goal Analysis & Step Decomposition Rules Engine
    if (goalLower.includes("شراء") || goalLower.includes("buy") || goalLower.includes("rfq")) {
      plan.steps.push({
        stepNumber: 1,
        toolName: "SEARCH_SUPPLIER",
        description: "البحث عن الموردين المعتمدين لمادة الطلب",
        params: { query: goal },
        requiresApproval: false
      });

      plan.steps.push({
        stepNumber: 2,
        toolName: "CREATE_RFQ",
        description: "إنشاء مسودة طلب السعر (RFQ)",
        params: { title: goal },
        requiresApproval: false
      });

      plan.steps.push({
        stepNumber: 3,
        toolName: "PUBLISH_RFQ",
        description: "نشر طلب السعر في المنصة للموردين",
        params: {},
        requiresApproval: false
      });
    }

    if (goalLower.includes("ترسية") || goalLower.includes("award") || goalLower.includes("approve")) {
      plan.steps.push({
        stepNumber: plan.steps.length + 1,
        toolName: "APPROVE_AWARD",
        description: "اعتماد الترسية التجارية للمورد الفائز",
        params: { quoteId: context?.quoteId || "default-quote-id" },
        requiresApproval: true
      });
      plan.requiresHumanApproval = true;
    }

    if (goalLower.includes("فاتورة") || goalLower.includes("invoice") || goalLower.includes("pay")) {
      plan.steps.push({
        stepNumber: plan.steps.length + 1,
        toolName: "CREATE_INVOICE",
        description: "إصدار فاتورة تجارية للمستحقات المالية",
        params: { amount: context?.amount || 10000 },
        requiresApproval: true
      });
      plan.requiresHumanApproval = true;
    }

    // Default fallback single-step plan if no keyword matched
    if (plan.steps.length === 0) {
      plan.steps.push({
        stepNumber: 1,
        toolName: "SEARCH_SUPPLIER",
        description: "استكشاف السوق المباشر",
        params: { query: goal },
        requiresApproval: false
      });
    }

    return plan;
  }
}

module.exports = AgentPlanner;
