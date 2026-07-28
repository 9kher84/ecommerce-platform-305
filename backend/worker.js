require('dotenv').config();
const os = require('os');
const express = require('express');
const { sequelize } = require('./sequelize_setup');
const OutboxRepository = require('./src/shared/infrastructure/outbox/OutboxRepository');
const PollingEventSourceAdapter = require('./src/shared/infrastructure/outbox/PollingEventSourceAdapter');
const InMemoryEventPublisherAdapter = require('./src/shared/infrastructure/eventBus/InMemoryEventPublisherAdapter');
const OutboxDispatcher = require('./src/shared/infrastructure/outbox/OutboxDispatcher');
const outboxMetrics = require('./src/shared/infrastructure/outbox/OutboxMetrics');

// Also load the PolicyRegistry so that InMemoryEventBus has its handlers attached
// If using Kafka, this worker might only publish and a separate consumer worker would handle them.
// But for now, our EventPublisherPort bridges to the local EventBus.
require('./src/shared/infrastructure/eventBus/PolicyRegistry').registerAll();

async function startWorker() {
  console.log('--------------------------------------------------');
  console.log('🚀 Starting Outbox Dispatcher Worker');
  console.log('--------------------------------------------------');

  try {
    await sequelize.authenticate();
    console.log('✅ Connected to database.');
  } catch (err) {
    console.error('❌ Database connection failed:', err);
    process.exit(1);
  }

  const config = {
    batchSize: parseInt(process.env.OUTBOX_BATCH_SIZE || '50', 10),
    pollIntervalMs: parseInt(process.env.OUTBOX_POLL_INTERVAL_MS || '2000', 10),
    maxRetries: parseInt(process.env.OUTBOX_MAX_RETRIES || '5', 10),
    baseBackoffMs: parseInt(process.env.OUTBOX_BASE_BACKOFF_MS || '1000', 10),
    maxBackoffMs: parseInt(process.env.OUTBOX_MAX_BACKOFF_MS || '60000', 10),
    nodeName: process.env.OUTBOX_NODE_NAME || `worker-${os.hostname()}-${process.pid}`
  };

  console.log('Worker Configuration:', config);

  const outboxRepo = new OutboxRepository();
  const publisher = new InMemoryEventPublisherAdapter();
  
  const eventSource = new PollingEventSourceAdapter({
    outboxRepo,
    config
  });

  const dispatcher = new OutboxDispatcher({
    eventSource,
    publisher,
    outboxRepo,
    config
  });

  dispatcher.start();
  
  // --------------------------------------------------
  // Health Check Server
  // --------------------------------------------------
  const app = express();
  const workerId = config.nodeName;
  const startTime = Date.now();

  app.get('/health', async (req, res) => {
    let dbStatus = 'DOWN';
    try {
      await sequelize.authenticate();
      dbStatus = 'UP';
    } catch (e) {
      dbStatus = 'DOWN';
    }

    // Try to get pending counts from DB
    let pendingEvents = -1;
    let deadLetters = -1;
    try {
      if (sequelize.models.OutboxEvent) {
        pendingEvents = await sequelize.models.OutboxEvent.count({ where: { status: 'PENDING' } });
        deadLetters = await sequelize.models.OutboxEvent.count({ where: { status: 'DEAD_LETTER' } });
      }
    } catch (e) {
      // Ignore
    }

    const metrics = outboxMetrics.getMetrics();
    
    res.json({
      status: dbStatus === 'UP' && dispatcher.isRunning ? 'UP' : 'DEGRADED',
      dispatcher: dispatcher.isRunning ? 'RUNNING' : 'STOPPED',
      database: dbStatus,
      lastPollAt: eventSource.lastPollAt || null,
      pendingEvents,
      deadLetters,
      workerId,
      uptimeSeconds: Math.floor((Date.now() - startTime) / 1000),
      metrics
    });
  });

  const PORT = process.env.OUTBOX_HEALTH_PORT || 8081;
  const server = app.listen(PORT, () => {
    console.log(`✅ Worker Health Check running on port ${PORT}`);
  });

  // Handle graceful shutdown
  const shutdown = () => {
    console.log('\n🛑 Received stop signal. Shutting down worker gracefully...');
    dispatcher.stop();
    server.close();
    // Allow any ongoing poll to finish, then exit
    setTimeout(() => {
      console.log('🛑 Worker stopped successfully.');
      process.exit(0);
    }, config.pollIntervalMs + 500);
  };

  process.on('SIGINT', shutdown);
  process.on('SIGTERM', shutdown);
}

startWorker();
