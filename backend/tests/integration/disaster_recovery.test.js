const db = require('../../sequelize_setup');
const { v4: uuidv4 } = require('uuid');
const OutboxRepository = require('../../src/shared/infrastructure/outbox/OutboxRepository');
const PollingEventSourceAdapter = require('../../src/shared/infrastructure/outbox/PollingEventSourceAdapter');
const OutboxDispatcher = require('../../src/shared/infrastructure/outbox/OutboxDispatcher');
const InMemoryEventPublisherAdapter = require('../../src/shared/infrastructure/eventBus/InMemoryEventPublisherAdapter');
const PolicyExecutionMiddleware = require('../../src/shared/application/PolicyExecutionMiddleware');

describe('Disaster Recovery & Failure Scenarios', () => {
  let outboxRepo;
  let inboxRepo;

  beforeAll(async () => {
    await db.OutboxEvent.sync({ force: true });
    await db.InboxEvent.sync({ force: true });
    outboxRepo = new OutboxRepository(db.OutboxEvent, db.sequelize);
  });

  afterAll(async () => {
    await db.OutboxEvent.destroy({ truncate: true });
    await db.InboxEvent.destroy({ truncate: true });
  });

  it('DR-1: Database unavailable during publish (API crash before commit) - No Outbox row exists', async () => {
    // If an API crashes BEFORE the transaction commits, no row exists in Outbox.
    // We simulate this by simply checking that a rolled-back transaction doesn't leave data.
    try {
      await db.sequelize.transaction(async (t) => {
        await outboxRepo.append([{
          eventId: uuidv4(),
          aggregateType: 'Test',
          aggregateId: uuidv4(),
          eventType: 'TestEvent',
          payload: {},
          correlationId: uuidv4()
        }], t);
        throw new Error('API Crashed!'); // Crash!
      });
    } catch (e) {}

    const count = await db.OutboxEvent.count();
    expect(count).toBe(0); // Atomicity ensures data consistency
  });

  it('DR-2: Worker restart recovers stuck PROCESSING events', async () => {
    // Insert a stuck event that was claimed 6 minutes ago (past the 5-minute timeout)
    const stuckEvent = await db.OutboxEvent.create({
      eventId: uuidv4(),
      aggregateType: 'Test',
      aggregateId: uuidv4(),
      eventType: 'TestEvent',
      payload: {},
      correlationId: uuidv4(),
      status: 'PROCESSING',
      occurredAt: new Date(),
      processingNode: 'dead-worker-01'
    });
    
    await db.sequelize.query(`UPDATE "OutboxEvents" SET "updatedAt" = NOW() - INTERVAL '6 minutes' WHERE id = :id`, {
      replacements: { id: stuckEvent.id }
    });

    let published = false;
    class DRPublisher extends InMemoryEventPublisherAdapter {
      async publish(event) {
        published = true;
      }
    }

    const config = { batchSize: 10, pollIntervalMs: 1000, nodeName: 'new-worker-02', baseBackoffMs: 1000, maxBackoffMs: 60000 };
    const eventSource = new PollingEventSourceAdapter({ outboxRepo, config });
    const dispatcher = new OutboxDispatcher({ eventSource, publisher: new DRPublisher(), outboxRepo, config });

    // One tick should recover the event
    const events = await outboxRepo.claim(config.batchSize, config.nodeName);
    await dispatcher.handleBatch(events);

    expect(published).toBe(true);
    const recovered = await db.OutboxEvent.findByPk(stuckEvent.id);
    expect(recovered.status).toBe('PUBLISHED');
  });

  it('DR-3: Long-running policy times out', async () => {
    // Test that if a policy takes too long and crashes, the worker isolates it and it fails safely
    const ev = await db.OutboxEvent.create({
      eventId: uuidv4(),
      aggregateType: 'Test',
      aggregateId: uuidv4(),
      eventType: 'LongEvent',
      payload: {},
      correlationId: uuidv4(),
      status: 'PENDING',
      occurredAt: new Date(),
    });

    const timeoutPolicyFn = async (event, t) => {
      throw new Error('Policy Timeout Crash');
    };
    const policyHandler = PolicyExecutionMiddleware.wrap('TimeoutConsumer', timeoutPolicyFn);

    class TimeoutPublisher extends InMemoryEventPublisherAdapter {
      async publish(event) {
        await policyHandler(event);
      }
    }

    const config = { batchSize: 10, pollIntervalMs: 1000, nodeName: 'worker-03', baseBackoffMs: 1000, maxBackoffMs: 60000, maxRetries: 5 };
    const eventSource = new PollingEventSourceAdapter({ outboxRepo, config });
    const dispatcher = new OutboxDispatcher({ eventSource, publisher: new TimeoutPublisher(), outboxRepo, config });

    const events2 = await outboxRepo.claim(config.batchSize, config.nodeName);
    await dispatcher.handleBatch(events2);

    const failed = await db.OutboxEvent.findByPk(ev.id);
    expect(failed.status).toBe('FAILED');
    expect(failed.retryCount).toBe(1);
    expect(failed.errorReason).toContain('Policy Timeout Crash');
  });
});
