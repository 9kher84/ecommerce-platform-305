const IValidator = require("../interfaces/IValidator");
const ValidationResult = require("../domain/ValidationResult");

class PricingValidator extends IValidator {
  /**
   * @param {Object} pricingEngine - Injected dependency
   */
  constructor(pricingEngine) {
    super();
    this.pricingEngine = pricingEngine;
  }

  /**
   * @param {import('../domain/CommercialOpportunityDTO')} dto 
   * @param {Object} context 
   * @returns {Promise<ValidationResult>}
   */
  async validate(dto, context) {
    const result = new ValidationResult();

    if (!dto.price) {
      result.addWarning("Price is missing. System will recommend a market price.");
      
      // Use the injected engine to get a recommendation
      if (this.pricingEngine && typeof this.pricingEngine.generatePriceRecommendation === "function") {
        try {
           const recommendation = await this.pricingEngine.generatePriceRecommendation(dto.name, context);
           if (recommendation && recommendation.suggestedPrice) {
             result.addSuggestion(`Recommended market price: ${recommendation.suggestedPrice} ${dto.currency || 'SAR'}`);
             result.metadata.suggestedPrice = recommendation.suggestedPrice;
           }
        } catch (error) {
           result.addWarning(`Failed to generate price recommendation: ${error.message}`);
        }
      }
    } else {
       // Validate against bounds if engine provides it
       if (this.pricingEngine && typeof this.pricingEngine.validatePrice === "function") {
           const validation = await this.pricingEngine.validatePrice(dto.price, dto.name, context);
           if (!validation.isValid) {
               result.addWarning(validation.message || "Price seems significantly out of market bounds.");
           }
       }
    }

    return result;
  }
}

module.exports = PricingValidator;
