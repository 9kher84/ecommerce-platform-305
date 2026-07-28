const { OrganizationPolicy } = require("../sequelize_setup");

/**
 * Commercial Policy Engine
 * Evaluates enterprise business policies for organizations beyond simple RBAC permissions.
 */
class CommercialPolicyEngine {
  static DEFAULT_POLICIES = {
    ALLOW_EXTERNAL_SALES: true,
    ALLOW_OFFLINE_UPLOADS: true,
    ALLOW_NEGOTIATIONS: true,
    ALLOW_AI_NEGOTIATIONS: false,
    ALLOW_UNLIMITED_QUOTES: true,
    ALLOW_DIRECT_CONTRACTS: false,
    ALLOW_GOVERNMENT_TENDERS: false,
    ALLOW_INTERNATIONAL_FULFILLMENT: true,
    ALLOW_PROXY_SALES: true,
    ALLOW_MULTI_BRANCH: true
  };

  /**
   * Evaluates if a specific Commercial Policy is allowed for an Organization
   * 
   * @param {string} organizationId 
   * @param {string} policyKey - e.g. 'ALLOW_AI_NEGOTIATIONS'
   * @param {Object} [context={}] 
   */
  static async evaluatePolicy(organizationId, policyKey, context = {}) {
    const key = policyKey.toUpperCase();
    
    // 1. Fetch DB Organization Policy if present
    const dbPolicy = await OrganizationPolicy.findOne({
      where: { organizationId }
    }).catch(() => null);

    let isAllowed = this.DEFAULT_POLICIES[key] !== undefined ? this.DEFAULT_POLICIES[key] : true;

    if (dbPolicy && dbPolicy.rules && dbPolicy.rules[key] !== undefined) {
      isAllowed = dbPolicy.rules[key];
    }

    // Context overrides (e.g. tier elevation)
    if (context.tier === "ENTERPRISE" && key === "ALLOW_AI_NEGOTIATIONS") {
      isAllowed = true;
    }

    return {
      organizationId,
      policyKey: key,
      isAllowed,
      source: dbPolicy ? "ORGANIZATION_POLICY" : "DEFAULT_SYSTEM_POLICY",
      evaluatedAt: new Date().toISOString()
    };
  }
}

module.exports = CommercialPolicyEngine;
