/**
 * IN-MEMORY EVENT BUS (Infrastructure Layer)
 * Implements a standard Pub/Sub contract for Domain Events.
 * Easily swappable with Outbox/Kafka later without changing Use Cases.
 */
class EventBus {
  constructor() {
    this.handlers = new Map();
  }

  /**
   * Subscribes a handler to a specific event type.
   * @param {string} eventType 
   * @param {Object} handler - Must implement `async handle(event)`
   */
  subscribe(eventType, handler) {
    if (!this.handlers.has(eventType)) {
      this.handlers.set(eventType, []);
    }
    this.handlers.get(eventType).push(handler);
  }

  /**
   * Unsubscribes a handler from a specific event type.
   * @param {string} eventType 
   * @param {Object} handler 
   */
  unsubscribe(eventType, handler) {
    if (!this.handlers.has(eventType)) return;
    const filtered = this.handlers.get(eventType).filter(h => h !== handler);
    this.handlers.set(eventType, filtered);
  }

  /**
   * Publishes an event to all subscribed handlers asynchronously.
   * @param {import('../../domain/DomainEvent')} event 
   */
  publish(event) {
    const eventName = event.name;
    const handlersForEvent = this.handlers.get(eventName) || [];
    
    console.log(`[EventBus] Publishing ${eventName} to ${handlersForEvent.length} handlers`);

    for (const handler of handlersForEvent) {
      // Fire and forget, capturing errors so one handler doesn't crash others
      const promise = typeof handler === 'function' ? handler(event) : handler.handle(event);
      Promise.resolve(promise).catch(err => {
        console.error(`[EventBus] Error in handler for ${eventName}:`, err);
      });
    }
  }
}

// Export a singleton instance for immediate use, though it can be injected.
const eventBusInstance = new EventBus();
module.exports = eventBusInstance;
