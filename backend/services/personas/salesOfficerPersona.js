const BaseAgent = require("../../sdk/BaseAgent");
const NegotiationIntelligenceEngine = require("../negotiationIntelligenceEngine");

/**
 * Sales Officer AI Persona
 * Specialized digital employee for customer proposals, win probabilities, counter-offers, and deal conversion.
 */
class SalesOfficerPersona extends BaseAgent {
  constructor() {
    super({
      id: "persona-sales-officer",
      name: "Commercial Sales Officer AI",
      version: "2.0.0",
      category: "SALES",
      description: "Specialized sales officer managing proposal submissions, win probability evaluation, and counter-offer strategy.",
      capabilities: ["SUBMIT_QUOTE", "EVALUATE_WIN_PROBABILITY", "CLOSE_DEAL"],
      requiredPermissions: ["VIEW_SUPPLIER"]
    });
  }

  async handleReasoning(context, prompt) {
    const quote = NegotiationIntelligenceEngine.evaluateCounterOffer({
      originalQuotePrice: context.quotePrice || 100000,
      targetBudget: context.targetBudget || 92000,
      currentRound: 1,
      strategy: "BALANCED"
    });

    return {
      success: true,
      persona: this.manifest.name,
      role: "SALES_OFFICER",
      decision: `Generated Strategic Counter-Offer (SAR ${quote.analysis.recommendedCounterPrice})`,
      confidencePercent: 91,
      salesProposal: quote
    };
  }
}

const salesOfficerPersona = new SalesOfficerPersona();

module.exports = {
  SalesOfficerPersona,
  salesOfficerPersona
};
