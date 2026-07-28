const {
  Organization,
  OrganizationMembership,
  User,
  Team,
  MembershipPermission,
  Permission,
  OrganizationPolicy,
  SeparationOfDutiesRule
} = require("../sequelize_setup");

/**
 * Agent Context Builder (Agent Brain Layer)
 * Assembles complete multi-tier Context Envelopes (Company, User, Permissions, Policies, Memory)
 * prior to LLM reasoning and execution.
 */
class AgentContextBuilder {
  /**
   * Build complete Context Envelope for Agent OS
   * 
   * @param {Object} payload
   * @param {string} payload.userId - User ID
   * @param {string} payload.organizationId - Target Organization ID
   * @param {string} payload.channel - Message Channel ('WHATSAPP' | 'EMAIL' | 'TEAMS' | 'WEB')
   * @param {string} payload.prompt - Raw user prompt/message
   */
  static async buildContext(payload) {
    const { userId, organizationId, channel, prompt } = payload;

    if (!userId || !organizationId) {
      throw new Error("ContextBuilder requires both 'userId' and 'organizationId'.");
    }

    // 1. Load Organization & Active Membership
    const organization = await Organization.findByPk(organizationId).catch(() => null);
    const membership = await OrganizationMembership.findOne({
      where: { userId, organizationId, status: "ACTIVE" }
    }).catch(() => null);

    const userObj = await User.findByPk(userId).catch(() => null);

    // 2. Load Permissions & Explicit Denies
    const directPermissions = membership ? await MembershipPermission.findAll({
      where: { membershipId: membership.id },
      include: [{ model: Permission }]
    }).catch(() => []) : [];

    const explicitDenies = [];
    const explicitAllows = [];

    directPermissions.forEach(mp => {
      const key = mp.permission?.key || mp.Permission?.key;
      if (key) {
        if (mp.effect === "DENY") explicitDenies.push(key);
        else if (mp.effect === "ALLOW") explicitAllows.push(key);
      }
    });

    // 3. Load Active Policies & SoD Rules
    const [policies, sodRules] = await Promise.all([
      OrganizationPolicy.findAll({ where: { organizationId, status: "ACTIVE" } }).catch(() => []),
      SeparationOfDutiesRule.findAll({ where: { organizationId, status: "ACTIVE" } }).catch(() => [])
    ]);

    // 4. Assemble Structured Context Envelope
    const contextEnvelope = {
      timestamp: new Date().toISOString(),
      channel: channel || "WEB",
      rawPrompt: prompt || "",

      organizationKnowledge: {
        id: organization?.id || organizationId,
        name: organization?.name || "شركة الإعمار الذهبي للمقاولات",
        activeProjects: ["Project A - Riyadh", "Project C - Jeddah"],
        currency: "SAR"
      },

      userIdentityAndMemory: {
        id: userObj?.id || userId,
        name: userObj?.name || "المستخدم الحالي",
        email: userObj?.email || "—",
        role: membership?.role || "BUSINESS_MANAGER",
        teams: ["Procurement Team"],
        preferences: {
          style: membership?.defaultViewMode || "PROFESSIONAL",
          negotiationStrategy: "Prioritize Speed & Quality",
          maxAutonomousApprovalLimit: 20000 // SAR 20,000 Threshold
        }
      },

      permissionsAndLimits: {
        isOwner: membership?.isOwner === true,
        allowedPermissions: explicitAllows,
        deniedPermissions: explicitDenies
      },

      governanceAndPolicies: {
        activePoliciesCount: policies.length,
        sodRulesActive: sodRules.map(r => r.ruleType || "CREATOR_NOT_APPROVER"),
        humanApprovalThreshold: 20000
      }
    };

    return contextEnvelope;
  }
}

module.exports = AgentContextBuilder;
