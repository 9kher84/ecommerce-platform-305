const ValidationResult = require("../domain/ValidationResult");

class ValidationPipeline {
  /**
   * @param {Array<import('../interfaces/IValidator')>} validators 
   */
  constructor(validators = []) {
    this.validators = validators;
  }

  /**
   * Executes all validators in sequence
   * @param {import('../domain/CommercialOpportunityDTO')} dto 
   * @param {Object} context 
   * @returns {Promise<ValidationResult>}
   */
  async execute(dto, context) {
    const finalResult = new ValidationResult();

    for (const validator of this.validators) {
      if (typeof validator.validate === "function") {
        const result = await validator.validate(dto, context);
        finalResult.merge(result);
        
        // Short-circuit if syntax is fundamentally broken? 
        // For now, we collect all errors if possible, or stop if isValid = false.
        // Let's stop the pipeline if a validator completely fails (e.g., SyntaxError).
        if (!result.isValid) {
          break;
        }
      }
    }

    return finalResult;
  }
}

module.exports = ValidationPipeline;
