/**
 * Feature Flag Engine
 * Universal feature flag evaluation based on Organization Type, Subscription Tier,
 * Verification Level, Country, Sector, and Owner Master Overrides.
 */
class FeatureFlagEngine {
  /**
   * Evaluates if a feature flag is enabled for an Organization context
   * 
   * @param {string} featureName - e.g. 'MERCHANT_PASSPORT', 'AI_PRICING', 'GOVERNMENT_TENDER'
   * @param {Object} context 
   * @param {string} [context.orgType='COMPANY'] - 'SOLE_PROPRIETORSHIP' | 'COMPANY' | 'FACTORY' | 'DISTRIBUTOR'
   * @param {string} [context.tier='PRO'] - 'FREE' | 'PRO' | 'ENTERPRISE'
   * @param {string} [context.verificationLevel='GOLD'] - 'NEW' | 'VERIFIED' | 'GOLD'
   * @param {Object} [context.ownerOverrides={}] - Master Owner Switch
   */
  static isFeatureEnabled(featureName, context = {}) {
    const { orgType = "COMPANY", tier = "PRO", verificationLevel = "GOLD", ownerOverrides = {} } = context;
    const flagKey = featureName.toUpperCase();

    // Owner Master Switch Overrides take top priority
    if (ownerOverrides[flagKey] !== undefined) {
      return {
        featureName: flagKey,
        isEnabled: Boolean(ownerOverrides[flagKey]),
        reason: "Evaluated by Owner Master Switch Override."
      };
    }

    // Default Feature Rules
    let isEnabled = true;
    if (flagKey === "GOVERNMENT_TENDER" && verificationLevel !== "GOLD") {
      isEnabled = false;
    } else if (flagKey === "AI_AUTOMATION" && tier !== "ENTERPRISE") {
      isEnabled = false;
    }

    return {
      featureName: flagKey,
      isEnabled,
      orgType,
      tier,
      verificationLevel,
      evaluatedAt: new Date().toISOString()
    };
  }
}

module.exports = FeatureFlagEngine;
