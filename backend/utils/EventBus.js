const EventEmitter = require("events");
const crypto = require("crypto");

class OperationalEventBus extends EventEmitter {}

const eventBus = new OperationalEventBus();

/**
 * Standardized Operational Event Contract (Version 1)
 * @typedef {Object} OperationalEvent
 * @property {string} id - Unique Event ID (UUID)
 * @property {number} version - Schema version (e.g., 1)
 * @property {string} eventType - Type of the event (e.g., 'PO_ACCEPTED')
 * @property {string} aggregateType - Source aggregate (e.g., 'PurchaseOrder')
 * @property {string} aggregateId - Source aggregate ID
 * @property {Date} occurredAt - Timestamp of the event
 * @property {Object} actor - Who triggered the event
 * @property {string} actor.type - e.g., 'seller', 'buyer', 'system'
 * @property {string} actor.id - The UUID of the actor
 * @property {Object} payload - Event specific data payload
 */

/**
 * Emits a standardized operational event.
 * @param {string} eventType 
 * @param {string} aggregateType 
 * @param {string} aggregateId 
 * @param {string} actorType 
 * @param {string} actorId 
 * @param {Object} payload 
 */
const emitOperationalEvent = (eventType, aggregateType, aggregateId, actorType, actorId, payload) => {
  const event = {
    id: crypto.randomUUID(),
    version: 1,
    eventType,
    aggregateType,
    aggregateId,
    occurredAt: new Date(),
    actor: {
      type: actorType,
      id: actorId
    },
    payload
  };
  eventBus.emit(eventType, event);
  eventBus.emit("*", event); // Catch-all listener
};

/**
 * Queue-ready Interface for Event Pub/Sub
 * This abstraction allows swapping EventEmitter with Kafka/RabbitMQ in the future without changing consumers.
 */
const publish = emitOperationalEvent;

const subscribe = (eventType, handler) => {
  eventBus.on(eventType, handler);
};

const subscribeAll = (handler) => {
  eventBus.on("*", handler);
};

module.exports = {
  publish,
  subscribe,
  subscribeAll,
  // Maintaining emitOperationalEvent for backward compatibility across the app temporarily
  emitOperationalEvent
};
