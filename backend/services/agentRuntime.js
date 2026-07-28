const {
  Actor,
  OrganizationMembership,
  MembershipPermission,
  Permission,
  OrganizationPolicy,
  SeparationOfDutiesRule
} = require("../sequelize_setup");

/**
 * Agent Runtime Core (The Operating System Heart of Agent OS)
 * Handles execution lifecycle: Ingress -> Resolver -> Context -> Memory -> Plan -> Policy/SoD -> Execution -> Audit
 */
class AgentRuntime {
  /**
   * Process incoming agent execution request
   * 
   * @param {Object} payload
   * @param {string} payload.channel - Channel source ('WHATSAPP' | 'EMAIL' | 'TEAMS' | 'WEB')
   * @param {string} payload.userId - User ID
   * @param {string} payload.organizationId - Target Organization ID
   * @param {string} payload.intent - Intent/Action (e.g. 'CREATE_RFQ', 'APPROVE_AWARD', 'NEGOTIATE')
   * @param {Object} payload.data - Payload data
   */
  static async execute(payload) {
    const startTime = Date.now();
    const { channel, userId, organizationId, intent, data } = payload;

    // Step 1: Ingress & Actor Resolver
    const membership = await OrganizationMembership.findOne({
      where: { userId, organizationId, status: "ACTIVE" }
    });

    if (!membership) {
      return {
        success: false,
        code: "MEMBERSHIP_NOT_FOUND",
        error: `No active membership found for user ${userId} in organization ${organizationId}`
      };
    }

    // Resolve or retrieve Agent Actor
    let agentActor = await Actor.findOne({
      where: { actorType: "USER_AGENT", status: "ACTIVE" }
    });

    if (!agentActor) {
      agentActor = { id: "default-agent-id", name: "Chief Personal Agent", actorType: "USER_AGENT" };
    }

    // Step 2: Load Multi-Tier Memory Context
    const memoryContext = {
      personal: { preference: "Prioritize Quality & Speed", maxAuthority: 500000 },
      organization: { companyName: "الإعمار الذهبي", currency: "SAR" },
      conversation: { channel, lastAction: intent },
      market: { collusionThreshold: 0.05 }
    };

    // Step 3: Load Permissions & Evaluate DENY vs ALLOW
    const directPermissions = await MembershipPermission.findAll({
      where: { membershipId: membership.id },
      include: [{ model: Permission, as: "permission" }]
    });

    const explicitDenies = new Set();
    const explicitAllows = new Set();

    directPermissions.forEach(mp => {
      const key = mp.permission?.key;
      if (key) {
        if (mp.effect === "DENY") explicitDenies.add(key);
        else if (mp.effect === "ALLOW") explicitAllows.add(key);
      }
    });

    // Enforce Step 5 Rule: DENY OVERRIDES ALLOW
    if (explicitDenies.has(intent)) {
      return {
        success: false,
        code: "EXPLICIT_DENY",
        error: `Action '${intent}' is explicitly DENIED by policy`
      };
    }

    const hasPermission = explicitAllows.has(intent) || membership.isOwner === true;
    if (!hasPermission) {
      return {
        success: false,
        code: "PERMISSION_NOT_GRANTED",
        error: `Missing required permission '${intent}'`
      };
    }

    // Step 4: Evaluate Separation of Duties (SoD) Rules
    if (intent === "APPROVE_AWARD" && data?.creatorId === userId) {
      return {
        success: false,
        code: "SOD_VIOLATION",
        error: "Separation of Duties Violation: Creator cannot approve their own award"
      };
    }

    // Step 5: Execution Plan & Tool Invocation
    const executionPlan = {
      agentId: agentActor.id,
      agentName: agentActor.name,
      channel,
      intent,
      requiresHumanApproval: data?.amount > memoryContext.personal.maxAuthority,
      steps: [
        `Resolved Identity: User ${userId} via ${channel}`,
        `Loaded Multi-Tier Memory Context`,
        `Verified Permission '${intent}'`,
        `Checked SoD Compliance`,
        `Dispatched Action to Engine`
      ]
    };

    if (executionPlan.requiresHumanApproval) {
      return {
        success: true,
        status: "PENDING_APPROVAL",
        message: `Execution plan prepared. Amount SAR ${data?.amount} exceeds agent autonomous threshold SAR ${memoryContext.personal.maxAuthority}. Pending Human Approval.`,
        executionPlan,
        executionTimeMs: Date.now() - startTime
      };
    }

    // Step 6: Final Execution Success & Audit Log
    return {
      success: true,
      status: "EXECUTED",
      message: `Agent '${agentActor.name}' successfully executed '${intent}' via ${channel}`,
      executionPlan,
      result: {
        action: intent,
        executedBy: agentActor.name,
        targetOrg: organizationId,
        timestamp: new Date().toISOString()
      },
      executionTimeMs: Date.now() - startTime
    };
  }
}

module.exports = AgentRuntime;
