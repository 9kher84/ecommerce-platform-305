const db = require('../../sequelize_setup');
const { v4: uuidv4 } = require('uuid');
const OutboxRepository = require('../../src/shared/infrastructure/outbox/OutboxRepository');
const InboxRepository = require('../../src/shared/infrastructure/inbox/InboxRepository');
const PolicyExecutionMiddleware = require('../../src/shared/application/PolicyExecutionMiddleware');
const OutboxDispatcher = require('../../src/shared/infrastructure/outbox/OutboxDispatcher');
const DomainEvent = require('../../src/shared/domain/DomainEvent');

describe('Outbox Recovery Scenarios', () => {
  let outboxRepo;
  let inboxRepo;

  beforeAll(async () => {
    expect(db.sequelize).toBeDefined();
    await db.OutboxEvent.sync({ force: true });
    await db.InboxEvent.sync({ force: true });
    outboxRepo = new OutboxRepository(db.OutboxEvent, db.sequelize);
    inboxRepo = new InboxRepository(db.InboxEvent);
    PolicyExecutionMiddleware.inboxRepo = inboxRepo;
  });

  afterAll(async () => {
    await db.sequelize.close();
  });

  afterEach(async () => {
    await db.OutboxEvent.destroy({ where: {} });
    await db.InboxEvent.destroy({ where: {} });
  });

  it('Scenario 1: Worker crash during Dispatch (Event stuck in PROCESSING) should be recoverable', async () => {
    // 1. Insert an event stuck in PROCESSING
    const eventId = uuidv4();
    await db.OutboxEvent.create({
      eventId,
      eventType: 'TestEvent',
      aggregateId: uuidv4(),
      aggregateType: 'TestAggregate',
      payload: { foo: 'bar' },
      correlationId: uuidv4(),
      schemaVersion: 1,
      aggregateVersion: 1,
      occurredAt: new Date(),
      status: 'PROCESSING', // Stuck here because worker crashed
      retryCount: 0,
      processingNode: 'dead-worker'
    });

    // Force updatedAt into the past to bypass Sequelize timestamp protections
    await db.sequelize.query(`UPDATE "OutboxEvents" SET "updatedAt" = NOW() - INTERVAL '10 minutes' WHERE "eventId" = :eventId`, {
      replacements: { eventId }
    });

    // 2. In a real system, a recovery job or claim() query would need to pick up 'PROCESSING' events 
    // older than a threshold. Our claim() handles this.
    const claimed = await outboxRepo.claim(10, 'new-worker', 5); // 5 minutes threshold
    
    expect(claimed.length).toBe(1);
    expect(claimed[0].eventId).toBe(eventId);
    expect(claimed[0].status).toBe('PROCESSING');
    expect(claimed[0].processingNode).toBe('new-worker');
  });

  it('Scenario 2: Worker crash after Publish but before Ack (Inbox prevents dual processing)', async () => {
    const eventId = uuidv4();
    const consumerName = 'RecoveryConsumer';

    // 1. Simulate Outbox Event
    const outboxEvent = await db.OutboxEvent.create({
      eventId,
      eventType: 'CrashTestEvent',
      aggregateId: uuidv4(),
      aggregateType: 'TestAggregate',
      payload: { crash: true },
      correlationId: uuidv4(),
      schemaVersion: 1,
      aggregateVersion: 1,
      occurredAt: new Date(),
      status: 'PROCESSING',
      processingNode: 'crashing-worker'
    });

    // 2. Simulate successful execution and Inbox record creation (but Ack failed/crashed)
    await db.sequelize.transaction(async (t) => {
      await inboxRepo.markAsProcessed(eventId, consumerName, uuidv4(), t);
      // policy executed successfully here
    });

    // Worker crashes...

    // 3. New Worker claims the event
    const claimed = await outboxRepo.claim(10, 'new-worker', 0); // 0 minutes threshold
    expect(claimed.length).toBe(1);

    // 4. Dispatcher runs it
    let policyExecutionCount = 0;
    const policyFn = async () => { policyExecutionCount++; };
    const wrappedPolicy = PolicyExecutionMiddleware.wrap(consumerName, policyFn);

    const publisher = {
      publish: async (domainEvent) => {
        await wrappedPolicy(domainEvent);
      }
    };

    const dispatcher = new OutboxDispatcher({
      eventSource: null,
      publisher,
      outboxRepo,
      config: { maxRetries: 3, baseBackoffMs: 10, maxBackoffMs: 100, nodeName: 'new-worker' }
    });

    await dispatcher.handleBatch(claimed);

    // 5. Verification
    expect(policyExecutionCount).toBe(0); // Idempotency prevented execution!
    
    // BUT the Outbox Event should now be ACKED correctly because the dispatcher succeeded (skip is success)
    const updatedOutbox = await db.OutboxEvent.findByPk(outboxEvent.id);
    expect(updatedOutbox.status).toBe('PUBLISHED');
  });
});
