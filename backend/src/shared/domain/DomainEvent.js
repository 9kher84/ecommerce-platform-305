const { v4: uuidv4 } = require('uuid');

class DomainEvent {
  /**
   * @param {string} name - Event name (e.g., 'QuotationSubmittedEvent')
   * @param {string} aggregateId - ID of the aggregate that produced the event
   * @param {string} aggregateType - Type of the aggregate (e.g., 'PurchaseRequest')
   * @param {Object} payload - Event payload
   * @param {number} schemaVersion - Schema version of the event
   * @param {number|null} aggregateVersion - Version of the aggregate at the time of the event
   * @param {string|null} correlationId - Traceability ID
   * @param {string|null} causationId - Cause Event ID
   */
  constructor(nameOrProps, aggregateId, aggregateType, payload, schemaVersion = 1, aggregateVersion = null, correlationId = null, causationId = null) {
    if (typeof nameOrProps === 'object' && nameOrProps !== null) {
      // Handle object argument
      this.eventId = uuidv4();
      this.name = nameOrProps.eventType || nameOrProps.name;
      this.aggregateId = nameOrProps.aggregateId;
      this.aggregateType = nameOrProps.aggregateType;
      this.aggregateVersion = nameOrProps.aggregateVersion || null;
      this.payload = nameOrProps.payload;
      this.schemaVersion = nameOrProps.schemaVersion || 1;
      this.correlationId = nameOrProps.correlationId || uuidv4();
      this.causationId = nameOrProps.causationId ?? null;
      this.occurredAt = new Date();
      // Optional extra fields for tracking
      if (nameOrProps.authContext) this.authContext = nameOrProps.authContext;
    } else {
      // Handle positional arguments
      this.eventId = uuidv4();
      this.name = nameOrProps;
      this.aggregateId = aggregateId;
      this.aggregateType = aggregateType;
      this.aggregateVersion = aggregateVersion;
      this.payload = payload;
      this.schemaVersion = schemaVersion;
      this.correlationId = correlationId || uuidv4();
      this.causationId = causationId ?? null;
      this.occurredAt = new Date();
    }
  }
}

module.exports = DomainEvent;
