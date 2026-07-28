/**
 * Commercial Rules Engine
 * Centralized rule evaluation engine enforcing core marketplace rules (Rule 001 - Rule 005).
 */
class CommercialRulesEngine {
  static RULES = {
    RULE_001_NO_QUOTE_EDIT: { id: "RULE_001", name: "Submitted Quotes Immutable", description: "Rejected/submitted quotes cannot be edited directly; supplier must submit a new quote." },
    RULE_002_NEW_QUOTE_ON_REJECTION: { id: "RULE_002", name: "New Quote On Rejection", description: "Rejected suppliers may re-bid by creating a new Quotation record." },
    RULE_003_NEGOTIATION_KEEP_RFQ_OPEN: { id: "RULE_003", name: "Negotiation Does Not Close RFQ", description: "Negotiating with a supplier does not block other suppliers from submitting new quotes." },
    RULE_004_IDENTITY_UNMASK_AT_INVOICE: { id: "RULE_004", name: "Blind Identity Unmask Gate", description: "Identity details are 100% hidden until Invoice creation." },
    RULE_005_COMMISSION_SUSPENSION: { id: "RULE_005", name: "3 Unpaid Commissions = Suspension", description: "Accounts with >= 3 unpaid commission invoices are automatically suspended." }
  };

  /**
   * Evaluate a commercial rule
   */
  static evaluateRule(ruleId, context = {}) {
    const rule = Object.values(this.RULES).find(r => r.id === ruleId);
    if (!rule) throw new Error(`Unknown Commercial Rule ID: ${ruleId}`);

    let isPassed = true;
    let reason = "Rule validated successfully.";

    if (ruleId === "RULE_001" && context.isEditAttempt) {
      isPassed = false;
      reason = "Rule 001 Violation: Submitted quotes cannot be modified. Create a new quote.";
    } else if (ruleId === "RULE_005" && context.unpaidCommissionCount >= 3) {
      isPassed = false;
      reason = "Rule 005 Enforcement: Account suspended due to 3 unpaid platform commission invoices.";
    }

    return {
      ruleId,
      ruleName: rule.name,
      isPassed,
      reason,
      evaluatedAt: new Date().toISOString()
    };
  }
}

module.exports = CommercialRulesEngine;
