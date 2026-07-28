const db = require('../../sequelize_setup');
const { v4: uuidv4 } = require('uuid');
const OutboxRepository = require('../../src/shared/infrastructure/outbox/OutboxRepository');
const PollingEventSourceAdapter = require('../../src/shared/infrastructure/outbox/PollingEventSourceAdapter');
const OutboxDispatcher = require('../../src/shared/infrastructure/outbox/OutboxDispatcher');
const InMemoryEventPublisherAdapter = require('../../src/shared/infrastructure/eventBus/InMemoryEventPublisherAdapter');
const PolicyExecutionMiddleware = require('../../src/shared/application/PolicyExecutionMiddleware');

async function runLoadTest() {
  const args = process.argv.slice(2);
  const getArg = (name, defaultVal) => {
    const idx = args.indexOf(`--${name}`);
    return idx >= 0 ? parseInt(args[idx + 1], 10) : defaultVal;
  };

  const NUM_EVENTS = getArg('events', 10000);
  const NUM_WORKERS = getArg('workers', 8);
  const BATCH_SIZE = getArg('batch', 50);

  console.log('----------------------------------------------------');
  console.log(`🚀 Starting Outbox Parametric Load Test`);
  console.log(`   Events:  ${NUM_EVENTS}`);
  console.log(`   Workers: ${NUM_WORKERS}`);
  console.log(`   Batch:   ${BATCH_SIZE}`);
  console.log('----------------------------------------------------');

  await db.sequelize.authenticate();
  await db.OutboxEvent.sync({ force: true });
  await db.InboxEvent.sync({ force: true });

  console.log('1. Seeding database with PENDING events...');
  const seedStartTime = Date.now();
  
  // Seed in chunks of 5000 to avoid out-of-memory or too many parameters error
  const CHUNK_SIZE = 5000;
  for (let i = 0; i < NUM_EVENTS; i += CHUNK_SIZE) {
    const events = Array.from({ length: Math.min(CHUNK_SIZE, NUM_EVENTS - i) }).map(() => ({
      id: uuidv4(),
      eventId: uuidv4(),
      aggregateType: 'LoadTestAggregate',
      aggregateId: uuidv4(),
      eventType: 'LoadTestTriggered',
      payload: { load: true },
      correlationId: uuidv4(),
      status: 'PENDING',
      occurredAt: new Date(),
    }));
    await db.OutboxEvent.bulkCreate(events);
    console.log(`   Seeded ${i + events.length} / ${NUM_EVENTS} events...`);
  }

  console.log(`✅ Seeding completed in ${Date.now() - seedStartTime}ms`);

  let policyExecutions = 0;
  const mockPolicyFn = async (event, t) => {
    policyExecutions++;
  };
  const policyHandler = PolicyExecutionMiddleware.wrap('LoadTestConsumer', mockPolicyFn);

  // Custom Publisher that pipes to the policy
  class LoadTestPublisher extends InMemoryEventPublisherAdapter {
    async publish(event) {
      await policyHandler(event);
    }
  }

  console.log('2. Starting Mock Workers...');
  const workers = [];
  const outboxRepo = new OutboxRepository(db.OutboxEvent, db.sequelize);
  const publisher = new LoadTestPublisher();

  for (let i = 0; i < NUM_WORKERS; i++) {
    const config = { batchSize: BATCH_SIZE, pollIntervalMs: 100, nodeName: `worker-${i}` };
    const eventSource = new PollingEventSourceAdapter({ outboxRepo, config });
    const dispatcher = new OutboxDispatcher({ eventSource, publisher, outboxRepo, config });
    
    // Silence logs for load test
    dispatcher.log = () => {}; 
    
    workers.push(dispatcher);
    dispatcher.start();
  }

  const dispatchStartTime = Date.now();
  console.log('3. Dispatching in progress... Waiting for completion.');

  // Polling to wait until all outbox events are published
  return new Promise((resolve) => {
    const checkInterval = setInterval(async () => {
      const pendingCount = await db.OutboxEvent.count({ where: { status: 'PENDING' } });
      const processingCount = await db.OutboxEvent.count({ where: { status: 'PROCESSING' } });

      if (pendingCount === 0 && processingCount === 0) {
        clearInterval(checkInterval);
        const duration = Date.now() - dispatchStartTime;
        
        console.log('----------------------------------------------------');
        console.log('✅ Load Test Completed!');
        console.log(`⏱️ Duration: ${duration} ms`);
        console.log(`📈 Throughput: ${((NUM_EVENTS / duration) * 1000).toFixed(2)} events/sec`);
        console.log(`🛡️ Policy Executions: ${policyExecutions} (Expected: ${NUM_EVENTS})`);
        console.log('----------------------------------------------------');
        
        workers.forEach(w => w.stop());
        
        if (policyExecutions !== NUM_EVENTS) {
          console.error(`❌ Mismatch in executions! Inbox failed to guarantee exactly-once processing.`);
          process.exit(1);
        }
        
        resolve();
      }
    }, 1000);
  });
}

if (require.main === module) {
  runLoadTest().then(() => {
    process.exit(0);
  }).catch(err => {
    console.error(err);
    process.exit(1);
  });
}
