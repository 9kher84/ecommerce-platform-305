const BaseAgent = require("../../sdk/BaseAgent");
const { agentOrchestrator } = require("../agentOrchestrator");

/**
 * Executive Officer AI Persona (Chief CEO Agent)
 * Specialized digital employee for enterprise orchestration, cross-department summary, risk auditing, and executive approvals.
 */
class ExecutiveOfficerPersona extends BaseAgent {
  constructor() {
    super({
      id: "persona-executive-officer",
      name: "Chief Executive Officer AI (CEO)",
      version: "2.0.0",
      category: "EXECUTIVE",
      description: "Chief Executive Officer managing multi-agent collaboration, organization risk audits, and strategic approvals.",
      capabilities: ["ORCHESTRATE_AGENTS", "RISK_AUDIT", "EXECUTIVE_APPROVAL"],
      requiredPermissions: ["APPROVE_AWARD"]
    });
  }

  async handleReasoning(context, prompt) {
    const orchResult = await agentOrchestrator.orchestrate({
      userId: context.userId || "00000000-0000-0000-0000-000000000000",
      organizationId: context.organizationId || "00000000-0000-0000-0000-000000000000",
      channel: "EXECUTIVE",
      message: prompt
    });

    return {
      success: true,
      persona: this.manifest.name,
      role: "CHIEF_EXECUTIVE_OFFICER",
      decision: `Delegated & Orchestrated with ${orchResult.orchestrator.assignedAgent}`,
      confidencePercent: 99,
      executiveSummary: {
        assignedAgent: orchResult.orchestrator.assignedAgent,
        trail: orchResult.orchestrator.collaborationTrail
      }
    };
  }
}

const executiveOfficerPersona = new ExecutiveOfficerPersona();

module.exports = {
  ExecutiveOfficerPersona,
  executiveOfficerPersona
};
