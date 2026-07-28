class InboxRepository {
  constructor(InboxEventModel) {
    this.InboxEvent = InboxEventModel || require('../../../../sequelize_setup').InboxEvent;
  }
  /**
   * Checks if an event has already been processed by a consumer.
   * @param {string} eventId 
   * @param {string} consumerName 
   * @returns {Promise<boolean>}
   */
  async hasProcessed(eventId, consumerName) {
    const model = this.InboxEvent || require('../../../../sequelize_setup').InboxEvent;
    const count = await model.count({
      where: { eventId, consumerName }
    });
    return count > 0;
  }

  /**
   * Marks an event as processed by a consumer within a transaction.
   * If another concurrent transaction tries to insert the same record, it will fail via unique constraint.
   * @param {string} eventId 
   * @param {string} consumerName 
   * @param {string} correlationId 
   * @param {Object} transaction 
   */
  async markAsProcessed(eventId, consumerName, correlationId, transaction) {
    const model = this.InboxEvent || require('../../../../sequelize_setup').InboxEvent;
    try {
      await model.create({
        eventId,
        consumerName,
        correlationId,
        processedAt: new Date()
      }, { transaction });
    } catch (err) {
      if (err.name === 'SequelizeUniqueConstraintError') {
        throw new Error(`IdempotencyConflict: Event ${eventId} has already been processed by ${consumerName}`);
      }
      throw err;
    }
  }
}

module.exports = InboxRepository;
