/**
 * PORT: Purchase Request Repository
 * Defines the contract that the Infrastructure Layer (Sequelize) must implement.
 * Domain and Application layers depend on this Port, NOT the DB ORM.
 */
class PurchaseRequestRepositoryPort {
  /**
   * @param {string} id
   * @returns {Promise<Object>} Aggregate Root (PurchaseRequest)
   */
  async findById(id) {
    throw new Error("ERR_METHOD_NOT_IMPLEMENTED");
  }

  /**
   * @param {string} id
   * @returns {Promise<boolean>}
   */
  async exists(id) {
    throw new Error("ERR_METHOD_NOT_IMPLEMENTED");
  }

  /**
   * @returns {string} newly generated UUID or ID
   */
  nextIdentity() {
    throw new Error("ERR_METHOD_NOT_IMPLEMENTED");
  }

  /**
   * @param {string} buyerId
   * @returns {Promise<Object[]>}
   */
  async findDraft(buyerId) {
    throw new Error("ERR_METHOD_NOT_IMPLEMENTED");
  }

  /**
   * @param {string} id
   * @returns {Promise<Object>} Aggregate Root (PurchaseRequest) locked for update
   */
  async lock(id) {
    throw new Error("ERR_METHOD_NOT_IMPLEMENTED");
  }

  /**
   * Persists the Aggregate using Optimistic Locking.
   * @param {import('../domain/entities/PurchaseRequest')} aggregate 
   * @param {number} expectedVersion
   * @param {import('sequelize').Transaction} [t] 
   * @returns {Promise<void>}
   */
  async store(aggregate, expectedVersion, t) {
    throw new Error('Method not implemented');
  }
}

module.exports = PurchaseRequestRepositoryPort;
