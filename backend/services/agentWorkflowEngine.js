const AgentRuntime = require("./agentRuntime");

/**
 * Agent Workflow Engine (Long-Lived Resumable Multi-Step Business Workflows)
 * Manages complex multi-step procurement, award, and invoice workflows.
 */
class AgentWorkflowEngine {
  constructor() {
    this.workflows = new Map();
  }

  /**
   * Create a long-lived workflow
   */
  createWorkflow(payload) {
    const { title, userId, organizationId, steps } = payload;
    const workflowId = `wf-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`;

    const workflow = {
      id: workflowId,
      title,
      userId,
      organizationId,
      status: "IN_PROGRESS", // 'IN_PROGRESS' | 'PAUSED' | 'PENDING_APPROVAL' | 'COMPLETED'
      currentStepIndex: 0,
      totalSteps: steps.length,
      createdAt: new Date().toISOString(),
      steps: steps.map((s, idx) => ({
        stepNumber: idx + 1,
        name: s.name,
        intent: s.intent,
        status: idx === 0 ? "CURRENT" : "PENDING",
        requiresApproval: s.requiresApproval || false,
        result: null
      }))
    };

    this.workflows.set(workflowId, workflow);
    return workflow;
  }

  /**
   * Execute current step in workflow and advance to next
   */
  async advanceWorkflow(workflowId) {
    const workflow = this.workflows.get(workflowId);
    if (!workflow) throw new Error(`Workflow '${workflowId}' not found.`);

    if (workflow.status === "COMPLETED") {
      return { success: true, message: "Workflow already completed", workflow };
    }

    const currentStep = workflow.steps[workflow.currentStepIndex];

    if (currentStep.requiresApproval && currentStep.status !== "APPROVED") {
      workflow.status = "PENDING_APPROVAL";
      return {
        success: false,
        code: "PENDING_HUMAN_APPROVAL",
        message: `Step ${currentStep.stepNumber} '${currentStep.name}' requires Human Approval.`,
        workflow
      };
    }

    // Execute step via AgentRuntime
    const runtimeResult = await AgentRuntime.execute({
      channel: "WORKFLOW",
      userId: workflow.userId,
      organizationId: workflow.organizationId,
      intent: currentStep.intent,
      data: { workflowId, step: currentStep.name }
    });

    currentStep.status = "COMPLETED";
    currentStep.result = runtimeResult;
    workflow.currentStepIndex += 1;

    if (workflow.currentStepIndex >= workflow.totalSteps) {
      workflow.status = "COMPLETED";
    } else {
      workflow.steps[workflow.currentStepIndex].status = "CURRENT";
    }

    return { success: true, workflow, runtimeResult };
  }
}

const agentWorkflowEngine = new AgentWorkflowEngine();

module.exports = {
  AgentWorkflowEngine,
  agentWorkflowEngine
};
