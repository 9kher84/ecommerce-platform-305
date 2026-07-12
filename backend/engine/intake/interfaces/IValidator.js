class IValidator {
  /**
   * Validates a CommercialOpportunityDTO.
   * @param {import('../domain/CommercialOpportunityDTO')} dto 
   * @param {Object} context 
   * @returns {Promise<import('../domain/ValidationResult')>}
   */
  async validate(dto, context) {
    throw new Error("Method 'validate()' must be implemented.");
  }
}

module.exports = IValidator;
