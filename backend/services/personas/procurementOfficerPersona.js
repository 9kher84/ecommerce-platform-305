const BaseAgent = require("../../sdk/BaseAgent");
const ProcurementIntelligenceService = require("../procurementIntelligenceService");

/**
 * Procurement Officer AI Persona
 * Specialized digital employee for RFQs, supplier qualification, quotation auditing, and negotiations.
 */
class ProcurementOfficerPersona extends BaseAgent {
  constructor() {
    super({
      id: "persona-procurement-officer",
      name: "Commercial Procurement Officer AI",
      version: "2.0.0",
      category: "PROCUREMENT",
      description: "Specialized procurement officer managing RFQ creation, supplier selection, and negotiation strategy.",
      capabilities: ["CREATE_RFQ", "PUBLISH_RFQ", "SEARCH_SUPPLIER", "EVALUATE_QUOTATION"],
      requiredPermissions: ["CREATE_RFQ", "PUBLISH_RFQ"]
    });
  }

  async handleReasoning(context, prompt) {
    const analysis = await ProcurementIntelligenceService.analyzeAndRecommendWinner(context.purchaseRequestId || "rfq-default");
    return {
      success: true,
      persona: this.manifest.name,
      role: "PROCUREMENT_OFFICER",
      decision: analysis.recommendation ? `Recommended Quote #${analysis.recommendation.recommendedQuoteId}` : "Issued RFQ Analysis",
      confidencePercent: 95,
      analysis
    };
  }
}

const procurementOfficerPersona = new ProcurementOfficerPersona();

module.exports = {
  ProcurementOfficerPersona,
  procurementOfficerPersona
};
