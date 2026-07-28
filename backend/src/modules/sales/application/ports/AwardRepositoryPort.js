class AwardRepositoryPort {
  /**
   * Retrieves an Award by its ID.
   * @param {string} id
   * @returns {Promise<import('../../domain/entities/Award')|null>}
   */
  async findById(id) {
    throw new Error('Method not implemented');
  }

  /**
   * Persists the Award aggregate using Optimistic Locking.
   * @param {import('../../domain/entities/Award')} aggregate
   * @param {number} expectedVersion
   * @param {import('sequelize').Transaction} [t]
   * @returns {Promise<void>}
   */
  async store(aggregate, expectedVersion, t) {
    throw new Error('Method not implemented');
  }
}

module.exports = AwardRepositoryPort;
