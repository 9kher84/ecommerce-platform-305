class AnalyzeOpportunityUseCase {
  /**
   * @param {import('../../engine/intake/UniversalIntakeService')} engine 
   */
  constructor(engine) {
    this.engine = engine;
  }

  /**
   * @param {string} rawText 
   * @param {Object} context 
   */
  async execute(rawText, context) {
    if (!rawText) throw new Error("Text is required");
    
    // Calls engine which parses, validates, and returns DTO + ValidationResult
    const result = await this.engine.processRawInput(rawText, context);
    return result;
  }
}

module.exports = AnalyzeOpportunityUseCase;
