const { Op } = require('sequelize');

class OutboxRepository {
  constructor(OutboxEventModel, sequelizeInstance) {
    this.OutboxEvent = OutboxEventModel || require('../../../../sequelize_setup').OutboxEvent;
    this.sequelize = sequelizeInstance || require('../../../../sequelize_setup').sequelize;
  }
  getDb() {
    return require('../../../../sequelize_setup');
  }

  /**
   * Appends Domain Events to the Outbox.
   * MUST be executed within the Aggregate's transaction.
   * @param {Array<import('../../domain/DomainEvent')>} events 
   * @param {Object} transaction 
   */
  async append(events, transaction) {
    if (!events || events.length === 0) return;

    const outboxRecords = events.map(event => {
      return {
        eventId: event.eventId,
        aggregateType: event.aggregateType || 'DomainAggregate',
        aggregateId: event.aggregateId,
        aggregateVersion: event.aggregateVersion,
        eventType: event.name,
        schemaVersion: event.schemaVersion,
        payload: event.payload,
        correlationId: event.correlationId,
        causationId: event.causationId,
        occurredAt: event.occurredAt,
        status: 'PENDING'
      };
    });

    const model = this.OutboxEvent || this.getDb().OutboxEvent;
    await model.bulkCreate(outboxRecords, { 
      transaction,
      validate: true
    });
  }

  /**
   * Claims a batch of pending/retryable events for processing.
   * Uses SKIP LOCKED to allow concurrent workers.
   * @param {number} limit 
   * @param {string} nodeName 
   * @param {Object} transaction 
   * @returns {Promise<Array<OutboxEvent>>}
   */
  async claim(limit, nodeName, thresholdMinutes = 5, transaction) {
    const thresholdTime = new Date(Date.now() - thresholdMinutes * 60000);

    // Select FOR UPDATE SKIP LOCKED and update atomically
    const query = `
      UPDATE "OutboxEvents" 
      SET status = 'PROCESSING', "processingNode" = :nodeName, "updatedAt" = NOW()
      WHERE id IN (
        SELECT id FROM "OutboxEvents"
        WHERE (status = 'PENDING' OR (status = 'FAILED' AND "nextRetryAt" <= NOW()) OR (status = 'PROCESSING' AND "updatedAt" <= :thresholdTime))
        ORDER BY "occurredAt" ASC, "aggregateVersion" ASC, "eventId" ASC
        LIMIT :limit
        FOR UPDATE SKIP LOCKED
      )
      RETURNING *;
    `;

    const model = this.OutboxEvent || this.getDb().OutboxEvent;
    const sq = this.sequelize || model.sequelize || this.getDb().sequelize;

    const options = {
      replacements: { limit, nodeName, thresholdTime },
      model: model,
      mapToModel: true
    };
    if (transaction) options.transaction = transaction;

    console.log('DEBUG CLAIM:', { 
      sqType: typeof sq, 
      sqConstructor: sq?.constructor?.name, 
      hasQuery: typeof sq?.query === 'function',
      optionsKeys: Object.keys(options)
    });

    const events = await sq.query(query, options);

    return events;
  }

  /**
   * Marks an event as successfully published.
   * @param {string} id - The internal OutboxEvent.id
   * @param {string} publishedBy 
   * @param {Object} transaction 
   */
  async ack(id, publishedBy, transaction) {
    const model = this.OutboxEvent || this.getDb().OutboxEvent;
    await model.update({
      status: 'PUBLISHED',
      publishedAt: new Date(),
      publishedBy: publishedBy
    }, {
      where: { id },
      transaction
    });
  }

  /**
   * Marks an event as failed and sets up the next retry.
   * @param {string} id - The internal OutboxEvent.id
   * @param {string} errorReason 
   * @param {number} newRetryCount 
   * @param {Date} nextRetryAt 
   * @param {boolean} isDeadLetter 
   * @param {Object} transaction 
   */
  async fail(id, errorReason, newRetryCount, nextRetryAt, isDeadLetter, transaction) {
    const model = this.OutboxEvent || this.getDb().OutboxEvent;
    await model.update({
      status: isDeadLetter ? 'DEAD_LETTER' : 'FAILED',
      errorReason: errorReason,
      lastErrorAt: new Date(),
      retryCount: newRetryCount,
      nextRetryAt: nextRetryAt
    }, {
      where: { id },
      transaction
    });
  }
}

module.exports = OutboxRepository;
