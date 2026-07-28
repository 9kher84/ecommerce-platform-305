class UnitOfWork {
  /**
   * @param {Object} deps
   * @param {import('./TransactionManager')} deps.transactionManager
   * @param {import('../infrastructure/outbox/OutboxRepository')} deps.outboxRepo
   */
  constructor({ transactionManager, outboxRepo }) {
    this.transactionManager = transactionManager;
    this.outboxRepo = outboxRepo;
  }

  /**
   * Executes the transaction callback and automatically pulls domain events 
   * from the provided aggregates to append them to the Outbox.
   * 
   * @param {Array<Object>} aggregates - List of aggregates that might have produced events
   * @param {function(Object): Promise<void>} callback - The function executing repository saves
   * @param {Object} [parentTransaction] - Optional parent transaction
   */
  async commit(aggregates, callback, parentTransaction = null) {
    if (!Array.isArray(aggregates)) {
      aggregates = [aggregates];
    }

    await this.transactionManager.execute(async (t) => {
      // 1. Execute Repositories save operations
      await callback(t);
      
      // 2. Collect all events from all aggregates involved in this transaction
      let allEvents = [];
      for (const aggregate of aggregates) {
        if (aggregate && typeof aggregate.pullEvents === 'function') {
          const events = aggregate.pullEvents();
          allEvents = allEvents.concat(events);
        }
      }

      // 3. Append events to the Outbox within the SAME transaction
      if (allEvents.length > 0) {
        await this.outboxRepo.append(allEvents, t);
      }
    }, parentTransaction);
  }
}

module.exports = UnitOfWork;
