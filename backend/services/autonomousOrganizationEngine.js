const AgentReasoningEngine = require("./agentReasoningEngine");
const BusinessKnowledgeGraph = require("./businessKnowledgeGraph");
const { agentWorkflowEngine } = require("./agentWorkflowEngine");

/**
 * Autonomous Organization Execution Engine
 * Drives end-to-end self-operating business process lifecycles with built-in human governance checkpoints.
 */
class AutonomousOrganizationEngine {
  /**
   * Run end-to-end autonomous business process lifecycle
   */
  static async runAutonomousLifecycle(payload) {
    const { userId, organizationId, channel, prompt } = payload;
    const startTime = Date.now();

    // 1. Read Enterprise Business Knowledge Graph
    const graphContext = await BusinessKnowledgeGraph.buildEnterpriseGraph(organizationId);

    // 2. Execute Reasoning Engine & Self-Critique
    const reasoningResult = await AgentReasoningEngine.thinkAndExecute({
      userId,
      organizationId,
      channel: channel || "AUTONOMOUS",
      message: prompt
    });

    // 3. Create Long-Lived Resumable Autonomous Workflow
    const workflow = agentWorkflowEngine.createWorkflow({
      title: `Autonomous Process: ${prompt}`,
      userId,
      organizationId,
      steps: [
        { name: "Enterprise Graph Context Verification", intent: "SEARCH_SUPPLIER" },
        { name: "Generate & Validate RFQ", intent: "CREATE_RFQ" },
        { name: "Human Governance & Approval Checkpoint", intent: "APPROVE_AWARD", requiresApproval: true }
      ]
    });

    // Advance step 1
    await agentWorkflowEngine.advanceWorkflow(workflow.id);

    return {
      success: true,
      autonomousLifecycleId: `auto-${Date.now()}`,
      status: "PAUSED_AT_HUMAN_GOVERNANCE_GATE",
      graphSummary: graphContext.graphSummary,
      reasoningIntent: reasoningResult.reasoningPipeline.intent,
      workflow,
      executionTimeMs: Date.now() - startTime
    };
  }
}

module.exports = AutonomousOrganizationEngine;
