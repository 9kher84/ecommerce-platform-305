const logger = require("../../utils/logger");

class UniversalIntakeService {
  /**
   * @param {import('./interfaces/IOpportunityParser')} parser 
   * @param {import('./validators/ValidationPipeline')} validationPipeline 
   */
  constructor(parser, validationPipeline) {
    if (!parser) throw new Error("Parser is required");
    if (!validationPipeline) throw new Error("ValidationPipeline is required");
    
    this.parser = parser;
    this.validationPipeline = validationPipeline;
  }

  /**
   * @param {string} rawText 
   * @param {Object} userContext 
   * @returns {Promise<Object>}
   */
  async processRawInput(rawText, userContext) {
    // 1. Generate CorrelationId for logging
    const correlationId = `intake-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
    
    this._log(correlationId, "Starting intake process");

    try {
      // 2. Parsing (No business logic, just extraction)
      this._log(correlationId, "Parsing raw text...");
      const dto = await this.parser.parse(rawText);
      
      // 3. Validation Pipeline
      this._log(correlationId, "Executing validation pipeline...");
      const validationResult = await this.validationPipeline.execute(dto, userContext);
      
      // 4. Construct Final Draft (DTO + Validation info)
      this._log(correlationId, "Process completed successfully");
      return {
        correlationId,
        opportunity: dto,
        validation: validationResult
      };

    } catch (error) {
      this._log(correlationId, `Error processing input: ${error.message}`, "error");
      throw error;
    }
  }

  _log(correlationId, message, level = "info") {
    // Stateless logging, outputting to standard transport
    logger[level](`[UniversalIntakeService] ${message}`, { correlationId });
  }
}

module.exports = UniversalIntakeService;
