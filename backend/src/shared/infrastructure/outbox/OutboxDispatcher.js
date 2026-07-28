const { sequelize } = require('../../../../sequelize_setup');
const DomainEvent = require('../../domain/DomainEvent');
const outboxMetrics = require('./OutboxMetrics');

class OutboxDispatcher {
  /**
   * @param {Object} deps 
   * @param {import('./OutboxEventSource')} deps.eventSource 
   * @param {import('../application/ports/EventPublisherPort')} deps.publisher 
   * @param {import('./OutboxRepository')} deps.outboxRepo 
   * @param {Object} config 
   * @param {number} config.maxRetries 
   * @param {number} config.baseBackoffMs 
   * @param {number} config.maxBackoffMs 
   * @param {string} config.nodeName 
   */
  constructor({ eventSource, publisher, outboxRepo, config }) {
    this.eventSource = eventSource;
    this.publisher = publisher;
    this.outboxRepo = outboxRepo;
    this.config = config;
  }

  start() {
    console.log(`[OutboxDispatcher - ${this.config.nodeName}] Starting...`);
    this.eventSource.start(this.handleBatch.bind(this));
  }

  stop() {
    console.log(`[OutboxDispatcher - ${this.config.nodeName}] Stopping...`);
    this.eventSource.stop();
  }

  /**
   * Processes a batch of claimed events sequentially.
   * Sequential processing maintains ordering for events within the batch.
   * A failure in one event does not crash the dispatcher; it marks that event as FAILED
   * and continues processing the rest of the batch.
   * 
   * @param {Array<import('../../../../models/OutboxEvent')>} outboxEvents 
   */
  async handleBatch(outboxEvents) {
    for (const outboxEvent of outboxEvents) {
      await this.processEvent(outboxEvent);
    }
  }

  /**
   * Processes a single OutboxEvent.
   * 1. Reconstructs the DomainEvent
   * 2. Publishes it via the Port
   * 3. Acks or Fails depending on success/error
   * 
   * @param {import('../../../../models/OutboxEvent')} outboxEvent 
   */
  async processEvent(outboxEvent) {
    const startTime = Date.now();
    try {
      // 1. Reconstruct DomainEvent
      const domainEvent = new DomainEvent(
        outboxEvent.eventType,
        outboxEvent.aggregateId,
        outboxEvent.aggregateType,
        outboxEvent.payload,
        outboxEvent.schemaVersion,
        outboxEvent.aggregateVersion,
        outboxEvent.correlationId,
        outboxEvent.causationId
      );
      // Override generated fields with the original ones
      domainEvent.eventId = outboxEvent.eventId;
      domainEvent.occurredAt = outboxEvent.occurredAt;
      domainEvent.aggregateType = outboxEvent.aggregateType;

      // 2. Publish via Port
      await this.publisher.publish(domainEvent);

      // 3. Ack success
      await this.outboxRepo.ack(outboxEvent.id, this.config.nodeName);

      outboxMetrics.incPublished();
      outboxMetrics.recordPublishTime(Date.now() - startTime);

      console.log(JSON.stringify({
        level: 'INFO',
        message: 'Event published successfully',
        eventId: outboxEvent.eventId,
        aggregateId: outboxEvent.aggregateId,
        correlationId: outboxEvent.correlationId,
        worker: this.config.nodeName,
        status: 'PUBLISHED'
      }));

    } catch (err) {
      console.error('DISPATCHER ERROR CAUGHT:', err.stack || err);
      console.error(JSON.stringify({
        level: 'ERROR',
        message: 'Error processing event',
        eventId: outboxEvent.eventId,
        error: err.message,
        worker: this.config.nodeName
      }));
      
      // 4. Handle Failure with Backoff Strategy
      const newRetryCount = outboxEvent.retryCount + 1;
      let nextRetryAt;
      let isDeadLetter = newRetryCount > this.config.maxRetries;

      if (isDeadLetter) {
        nextRetryAt = null;
        outboxMetrics.incDeadLetters();
      } else {
        const backoffDelay = Math.min(
          this.config.baseBackoffMs * Math.pow(2, outboxEvent.retryCount),
          this.config.maxBackoffMs
        );
        nextRetryAt = new Date(Date.now() + backoffDelay);
        outboxMetrics.incRetries();
      }

      outboxMetrics.incFailed();

      const errorReason = err.message || String(err);

      await this.outboxRepo.fail(
        outboxEvent.id, 
        errorReason, 
        newRetryCount, 
        nextRetryAt, 
        isDeadLetter
      );
    }
  }
}

module.exports = OutboxDispatcher;
