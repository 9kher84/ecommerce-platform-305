/**
 * Seller Capability Engine
 * Evaluates subscription tier, seller reputation level, and Owner Master Policies
 * to return dynamically enabled modules, widgets, and feature flags for the Seller Platform Console.
 */
class SellerCapabilityEngine {
  static ALL_MODULES = [
    "TODAY_BUSINESS",
    "PURCHASE_OPPORTUNITIES",
    "QUOTATIONS",
    "ORDERS_AND_FULFILLMENT",
    "PRODUCTS_INGRESS",
    "INVENTORY",
    "CUSTOMER_DEALS",
    "FINANCE",
    "PERFORMANCE_METRICS",
    "REPORTS",
    "AI_INTELLIGENCE",
    "AUTOMATION",
    "SETTINGS"
  ];

  /**
   * Evaluates enabled capabilities for a Seller Organization
   * 
   * @param {Object} context
   * @param {string} [context.tier='PRO'] - 'FREE' | 'PRO' | 'ENTERPRISE'
   * @param {number} [context.reputationScore=4.5] - Seller score
   * @param {Object} [context.ownerPolicyOverrides={}] - Custom owner overrides
   */
  static getSellerCapabilities(context = {}) {
    const { tier = "PRO", reputationScore = 4.5, ownerPolicyOverrides = {} } = context;

    // Default modules enabled by tier
    const enabledModules = new Set([
      "TODAY_BUSINESS",
      "PURCHASE_OPPORTUNITIES",
      "QUOTATIONS",
      "ORDERS_AND_FULFILLMENT",
      "PRODUCTS_INGRESS",
      "CUSTOMER_DEALS",
      "SETTINGS"
    ]);

    if (tier === "PRO" || tier === "ENTERPRISE") {
      enabledModules.add("INVENTORY");
      enabledModules.add("FINANCE");
      enabledModules.add("PERFORMANCE_METRICS");
      enabledModules.add("REPORTS");
    }

    if (tier === "ENTERPRISE") {
      enabledModules.add("AI_INTELLIGENCE");
      enabledModules.add("AUTOMATION");
    }

    // Apply Owner Policy Overrides (Owner Master Switch Control)
    Object.keys(ownerPolicyOverrides).forEach(moduleKey => {
      if (ownerPolicyOverrides[moduleKey] === true) {
        enabledModules.add(moduleKey);
      } else if (ownerPolicyOverrides[moduleKey] === false) {
        enabledModules.delete(moduleKey);
      }
    });

    return {
      tier,
      reputationScore,
      enabledModules: Array.from(enabledModules),
      widgets: {
        showAiPricingAssistant: enabledModules.has("AI_INTELLIGENCE"),
        showAutomationRules: enabledModules.has("AUTOMATION"),
        showFinancialLedger: enabledModules.has("FINANCE"),
        showReportsExport: enabledModules.has("REPORTS")
      },
      evaluatedAt: new Date().toISOString()
    };
  }
}

module.exports = SellerCapabilityEngine;
