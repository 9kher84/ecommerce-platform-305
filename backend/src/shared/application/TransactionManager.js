const { sequelize } = require('../../../sequelize_setup');

class TransactionManager {
  /**
   * Executes a callback within a database transaction.
   * Commits if successful, rolls back if an error occurs.
   * If a parent transaction is provided, it simply reuses it (delegating commit/rollback to the parent).
   * @param {function(Object): Promise<void>} callback - The callback receiving the transaction object.
   * @param {Object} [parentTransaction] - Optional existing transaction.
   * @returns {Promise<void>}
   */
  async execute(callback, parentTransaction = null) {
    if (parentTransaction) {
      await callback(parentTransaction);
      return;
    }

    const t = await sequelize.transaction();
    try {
      await callback(t);
      await t.commit();
    } catch (error) {
      await t.rollback();
      throw error;
    }
  }
}

module.exports = TransactionManager;
