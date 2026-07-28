const db = require('../../sequelize_setup');
const { v4: uuidv4 } = require('uuid');
const OutboxRepository = require('../../src/shared/infrastructure/outbox/OutboxRepository');
const InboxRepository = require('../../src/shared/infrastructure/inbox/InboxRepository');
const UnitOfWork = require('../../src/shared/application/UnitOfWork');
const TransactionManager = require('../../src/shared/application/TransactionManager');
const DomainEvent = require('../../src/shared/domain/DomainEvent');
const EventPublisherPort = require('../../src/shared/application/ports/EventPublisherPort');
const PolicyExecutionMiddleware = require('../../src/shared/application/PolicyExecutionMiddleware');
const OutboxDispatcher = require('../../src/shared/infrastructure/outbox/OutboxDispatcher');

// A dummy EventPublisherAdapter that pipes events directly back to our mock Policy
class TestEventPublisherAdapter extends EventPublisherPort {
  constructor(policyHandler) {
    super();
    this.policyHandler = policyHandler;
  }
  async publish(event) {
    await this.policyHandler(event);
  }
}

describe('Full Event Pipeline E2E (Outbox -> Dispatcher -> Inbox -> UoW)', () => {
  let uow;
  let outboxRepo;
  let inboxRepo;
  let transactionManager;

  beforeAll(async () => {
    await db.OutboxEvent.sync({ force: true });
    await db.InboxEvent.sync({ force: true });
    transactionManager = new TransactionManager();
    outboxRepo = new OutboxRepository(db.OutboxEvent, db.sequelize);
    inboxRepo = new InboxRepository(db.InboxEvent);
    uow = new UnitOfWork({ transactionManager, outboxRepo });
    // Overwrite the middleware's internal repo to our test instance
    PolicyExecutionMiddleware.inboxRepo = inboxRepo;
  });

  afterAll(async () => {
    await db.sequelize.close();
  });

  afterEach(async () => {
    await db.OutboxEvent.destroy({ where: {} });
    await db.InboxEvent.destroy({ where: {} });
  });

  it('should successfully execute the full pipeline exactly once without dual writes', async () => {
    const aggregateId = uuidv4();
    const eventId1 = uuidv4();
    const correlationId = uuidv4();

    // 1. Mock Aggregate generating an event
    const mockAggregate = {
      id: aggregateId,
      pullEvents: () => {
        const ev = new DomainEvent('TestTriggerEvent', aggregateId, 'TestAggregate', { data: 'test' });
        ev.eventId = eventId1;
        ev.correlationId = correlationId;
        return [ev];
      }
    };

    // 2. Mock Use Case Execution storing the first aggregate
    await uow.commit([mockAggregate], async (t) => {
      // Simulate saving an aggregate to the DB
      // await someRepo.save(mockAggregate, t);
    });

    // Verify Outbox appended
    const outboxRecords = await db.OutboxEvent.findAll();
    expect(outboxRecords.length).toBe(1);
    expect(outboxRecords[0].status).toBe('PENDING');

    // 3. Define a Policy that reacts to TestTriggerEvent and triggers another UseCase
    let policyExecutionCount = 0;
    const testPolicyFn = async (event, t) => {
      policyExecutionCount++;
      
      // Secondary UseCase
      const mockSecondaryAggregate = {
        id: uuidv4(),
        pullEvents: () => {
          const ev2 = new DomainEvent('TestResultEvent', mockSecondaryAggregate.id, 'SecondaryAggregate', { ok: true });
          ev2.correlationId = event.correlationId;
          ev2.causationId = event.eventId;
          return [ev2];
        }
      };

      // Ensure the secondary use case commits using the same transaction passed by the middleware
      await uow.commit([mockSecondaryAggregate], async (innerT) => {
        console.log("TRANSACTION MATCH:", { 
          t_id: t?.id, 
          innerT_id: innerT?.id, 
          isSame: t === innerT 
        });
        // Assert we are using the passed transaction
        expect(innerT.id).toBe(t.id);
      }, t);
    };

    const policyHandler = PolicyExecutionMiddleware.wrap('TestPolicyConsumer', testPolicyFn);

    // 4. Set up Dispatcher
    const publisher = new TestEventPublisherAdapter(policyHandler);
    const dispatcherConfig = { maxRetries: 3, baseBackoffMs: 10, maxBackoffMs: 100, nodeName: 'test-node' };
    
    const dispatcher = new OutboxDispatcher({
      eventSource: null, // We will manually call handleBatch
      publisher,
      outboxRepo,
      config: dispatcherConfig
    });

    // 5. Manually claim and dispatch
    const claimed = await outboxRepo.claim(10, 'test-node');
    expect(claimed.length).toBe(1);
    await dispatcher.handleBatch(claimed);

    // 6. Assertions
    // Policy was executed exactly once
    expect(policyExecutionCount).toBe(1);

    // First Outbox Event is ACKED
    const updatedFirstEvent = await db.OutboxEvent.findByPk(claimed[0].id);
    expect(updatedFirstEvent.status).toBe('PUBLISHED');

    // Inbox Event was created for Idempotency
    const inboxRecords = await db.InboxEvent.findAll();
    expect(inboxRecords.length).toBe(1);
    expect(inboxRecords[0].eventId).toBe(eventId1);
    expect(inboxRecords[0].consumerName).toBe('TestPolicyConsumer');
    expect(inboxRecords[0].correlationId).toBe(correlationId);

    // Second Outbox Event was appended correctly (with causation link)
    const allOutbox = await db.OutboxEvent.findAll({ order: [['savedAt', 'ASC']] });
    expect(allOutbox.length).toBe(2);
    expect(allOutbox[1].eventType).toBe('TestResultEvent');
    expect(allOutbox[1].correlationId).toBe(correlationId);
    expect(allOutbox[1].causationId).toBe(eventId1);
    expect(allOutbox[1].status).toBe('PENDING');

    // 7. Verify Idempotency against duplicate delivery
    // Re-dispatch the EXACT same event manually (simulating network duplicate delivery)
    await dispatcher.handleBatch(claimed);
    
    // Policy count should STILL be 1!
    expect(policyExecutionCount).toBe(1);
    
    // 8. Verify Inbox has the event
    const inboxCount = await db.InboxEvent.count({ where: { eventId: eventId1 } });
    expect(inboxCount).toBe(1);
    await dispatcher.handleBatch(claimed);
    
    // Policy should NOT have executed again
    expect(policyExecutionCount).toBe(1); // Still 1!
  });
});
