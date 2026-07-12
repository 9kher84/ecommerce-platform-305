const IValidator = require("../interfaces/IValidator");
const ValidationResult = require("../domain/ValidationResult");

class SyntaxValidator extends IValidator {
  /**
   * @param {import('../domain/CommercialOpportunityDTO')} dto 
   * @param {Object} context 
   * @returns {Promise<ValidationResult>}
   */
  async validate(dto, context) {
    const result = new ValidationResult();

    if (!dto.type) {
      result.addError("Missing opportunity type (SUPPLY or DEMAND)");
    } else if (dto.type !== "SUPPLY" && dto.type !== "DEMAND") {
      result.addError("Invalid opportunity type");
    }

    if (!dto.name || dto.name.trim() === "") {
      result.addError("Opportunity name is required");
    }

    if (dto.price !== null && isNaN(dto.price)) {
      result.addError("Price must be a valid number");
    } else if (dto.price !== null && dto.price <= 0) {
      result.addWarning("Price is zero or negative. Is this a free item?");
    }

    if (dto.quantity !== null && isNaN(dto.quantity)) {
      result.addError("Quantity must be a valid number");
    }

    return result;
  }
}

module.exports = SyntaxValidator;
