class OutboxEventSource {
  /**
   * Starts listening for Outbox events and passes batches to the handler.
   * @param {function(Array<import('../../../models/OutboxEvent')>): Promise<void>} handler 
   */
  start(handler) {
    throw new Error('Method not implemented.');
  }

  /**
   * Stops listening for Outbox events.
   */
  stop() {
    throw new Error('Method not implemented.');
  }
}

module.exports = OutboxEventSource;
