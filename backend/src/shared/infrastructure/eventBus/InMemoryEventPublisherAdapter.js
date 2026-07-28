const EventPublisherPort = require('../../application/ports/EventPublisherPort');
const EventBus = require('./EventBus');

class InMemoryEventPublisherAdapter extends EventPublisherPort {
  /**
   * Publishes the event to the in-memory EventBus.
   * In a real clustered environment, this would publish to Kafka/RabbitMQ.
   * @param {import('../../domain/DomainEvent')} event 
   */
  async publish(event) {
    // We use the existing EventBus to route events to internal handlers
    // The EventBus publish method is synchronous for routing, but handlers are async.
    EventBus.publish(event);
    
    // In an in-memory bus, we resolve immediately. 
    // Handlers running in the background shouldn't block the outbox ack,
    // as their own failures will be handled by their own retries (or poison message tracking).
    return Promise.resolve();
  }
}

module.exports = InMemoryEventPublisherAdapter;
