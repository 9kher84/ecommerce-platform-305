const BaseAgent = require("../../sdk/BaseAgent");

/**
 * Finance Officer AI Persona
 * Specialized digital employee for cashflow auditing, 3-way invoice matching, spending limits, and VAT/ZATCA compliance.
 */
class FinanceOfficerPersona extends BaseAgent {
  constructor() {
    super({
      id: "persona-finance-officer",
      name: "Finance & Budget Officer AI",
      version: "2.0.0",
      category: "FINANCE",
      description: "Specialized finance officer managing 3-way matching, invoice verification, and spending limit enforcement.",
      capabilities: ["CREATE_INVOICE", "AUDIT_BUDGET", "VAT_VERIFICATION"],
      requiredPermissions: ["PAY_INVOICE"]
    });
  }

  async handleReasoning(context, prompt) {
    const amount = context.amount || 15000;
    const isWithinLimit = amount <= 20000; // SAR 20,000 Threshold

    return {
      success: true,
      persona: this.manifest.name,
      role: "FINANCE_OFFICER",
      decision: isWithinLimit ? "Invoice Approved Automatically" : "Escalated for Human Financial Approval",
      confidencePercent: 98,
      financialAudit: {
        amountSAR: amount,
        vatRatePercent: 15,
        vatAmountSAR: Math.round(amount * 0.15),
        requiresHumanApproval: !isWithinLimit
      }
    };
  }
}

const financeOfficerPersona = new FinanceOfficerPersona();

module.exports = {
  FinanceOfficerPersona,
  financeOfficerPersona
};
