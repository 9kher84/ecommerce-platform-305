/**
 * PORT: Quotation Repository Interface
 * Defines the contract for Quotation persistence using Domain Language.
 */
class QuotationRepositoryPort {
  
  /**
   * @param {string} id 
   * @returns {Promise<Object>} The Quotation Aggregate
   */
  async findById(id) {
    throw new Error("ERR_METHOD_NOT_IMPLEMENTED");
  }

  /**
   * @param {string} purchaseRequestId
   * @param {string} sellerOrganizationId
   * @returns {Promise<Array<Object>>} List of Quotation Aggregates
   */
  async findByRequestAndSeller(purchaseRequestId, sellerOrganizationId) {
    throw new Error("ERR_METHOD_NOT_IMPLEMENTED");
  }

  /**
   * Persists a Quotation Aggregate (New or updated)
   * @param {Object} aggregate 
   * @param {Object} [t] - Optional Sequelize Transaction
   * @returns {Promise<void>}
   */
  async store(aggregate, t) {
    throw new Error("ERR_METHOD_NOT_IMPLEMENTED");
  }
}

module.exports = QuotationRepositoryPort;
