class IOpportunityParser {
  /**
   * Parses raw input into a structured DTO.
   * @param {string} input 
   * @returns {Promise<import('../domain/CommercialOpportunityDTO')>}
   */
  async parse(input) {
    throw new Error("Method 'parse()' must be implemented.");
  }
}

module.exports = IOpportunityParser;
