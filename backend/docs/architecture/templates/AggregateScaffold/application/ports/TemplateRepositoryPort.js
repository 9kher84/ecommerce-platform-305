class TemplateRepositoryPort {
  /**
   * Finds an aggregate by ID.
   * @param {string} id 
   * @returns {Promise<TemplateAggregate>}
   */
  async findById(id) { throw new Error("Not implemented"); }

  /**
   * Stores the aggregate, enforcing optimistic locking.
   * @param {TemplateAggregate} aggregate 
   * @param {number} expectedVersion 
   * @param {Object} transaction 
   */
  async store(aggregate, expectedVersion, transaction) { throw new Error("Not implemented"); }
}

module.exports = TemplateRepositoryPort;
