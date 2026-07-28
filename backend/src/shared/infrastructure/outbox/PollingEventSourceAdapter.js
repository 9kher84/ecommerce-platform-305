const OutboxEventSource = require('./OutboxEventSource');
const { sequelize } = require('../../../../sequelize_setup');

class PollingEventSourceAdapter extends OutboxEventSource {
  /**
   * @param {Object} deps 
   * @param {import('./OutboxRepository')} deps.outboxRepo 
   * @param {Object} config
   * @param {number} config.batchSize
   * @param {number} config.pollIntervalMs
   * @param {string} config.nodeName
   */
  constructor({ outboxRepo, config }) {
    super();
    this.outboxRepo = outboxRepo;
    this.config = config;
    this.timeoutId = null;
    this.isRunning = false;
  }

  start(handler) {
    if (this.isRunning) return;
    this.isRunning = true;

    const poll = async () => {
      if (!this.isRunning) return;
      
      let claimedEvents = [];
      try {
        // 1. Claim in a short-lived transaction
        await sequelize.transaction(async (t) => {
          claimedEvents = await this.outboxRepo.claim(this.config.batchSize, this.config.nodeName, 5, t);
        });

        // 2. Pass to handler OUTSIDE the transaction so we don't hold DB locks during publishing
        if (claimedEvents.length > 0) {
          await handler(claimedEvents);
        }
      } catch (err) {
        console.error(`[PollingEventSourceAdapter Node: ${this.config.nodeName}] Error during polling:`, err);
      } finally {
        if (this.isRunning) {
          // Dynamic Polling: If we hit the batch limit, there might be more events waiting right now.
          // In that case, use setImmediate to poll again without waiting the full interval.
          if (claimedEvents.length === this.config.batchSize) {
            this.timeoutId = setImmediate(poll);
          } else {
            this.timeoutId = setTimeout(poll, this.config.pollIntervalMs);
          }
        }
      }
    };

    poll();
  }

  stop() {
    this.isRunning = false;
    if (this.timeoutId) {
      clearTimeout(this.timeoutId);
      this.timeoutId = null;
    }
  }
}

module.exports = PollingEventSourceAdapter;
