class EventPublisherPort {
  /**
   * Publishes a DomainEvent to the message broker/event bus.
   * @param {import('../../domain/DomainEvent')} event 
   * @returns {Promise<void>}
   */
  async publish(event) {
    throw new Error('Method not implemented.');
  }
}

module.exports = EventPublisherPort;
