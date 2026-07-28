const { sequelize } = require('../../../sequelize_setup');
const InboxRepository = require('../infrastructure/inbox/InboxRepository');
const outboxMetrics = require('../infrastructure/outbox/OutboxMetrics');

class PolicyExecutionMiddleware {
  constructor() {
    this.inboxRepo = new InboxRepository();
  }

  /**
   * Wraps a policy handler with Idempotency (Inbox Pattern), Structured Logging, and Metrics.
   * @param {string} consumerName - A unique name for this policy (e.g., 'EscrowInitializationPolicy')
   * @param {function(import('../../domain/DomainEvent'), Object): Promise<void>} policyFn 
   */
  wrap(consumerName, policyFn) {
    return async (event) => {
      const startTime = Date.now();

      // 1. Structured Log: Received
      console.log(JSON.stringify({
        level: 'INFO',
        message: 'Policy execution started',
        consumer: consumerName,
        eventId: event.eventId,
        correlationId: event.correlationId,
      }));

      try {
        // 2. Check Idempotency without locking (Fast path)
        const hasProcessed = await this.inboxRepo.hasProcessed(event.eventId, consumerName);
        if (hasProcessed) {
          console.log(JSON.stringify({
            level: 'INFO',
            message: 'Idempotency skip: Event already processed',
            consumer: consumerName,
            eventId: event.eventId,
          }));
          outboxMetrics.incDuplicateInboxSkips();
          return; // Skip execution
        }

        // 3. Execute with Transaction wrapper
        await sequelize.transaction(async (t) => {
          // Lock Idempotency Key
          await this.inboxRepo.markAsProcessed(event.eventId, consumerName, event.correlationId, t);
          
          // Execute Policy
          await policyFn(event, t);
        });

        const durationMs = Date.now() - startTime;
        
        // 4. Structured Log: Success & Metrics
        console.log(JSON.stringify({
          level: 'INFO',
          message: 'Policy execution succeeded',
          consumer: consumerName,
          eventId: event.eventId,
          correlationId: event.correlationId,
          durationMs
        }));

      } catch (err) {
        if (err.message && err.message.includes('IdempotencyConflict')) {
           // Another concurrent worker beat us to it
           console.log(JSON.stringify({
             level: 'INFO',
             message: 'Idempotency conflict: Event processed by another concurrent worker',
             consumer: consumerName,
             eventId: event.eventId,
           }));
           return;
        }

        const durationMs = Date.now() - startTime;
        
        // 5. Structured Log: Failure & Metrics
        console.error(JSON.stringify({
          level: 'ERROR',
          message: 'Policy execution failed',
          consumer: consumerName,
          eventId: event.eventId,
          correlationId: event.correlationId,
          error: err.message,
          durationMs
        }));
        
        throw err; // Re-throw to trigger DLQ or retry upstream
      }
    };
  }
}

module.exports = new PolicyExecutionMiddleware();
