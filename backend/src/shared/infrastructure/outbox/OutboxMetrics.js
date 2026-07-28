/**
 * Observability layer for the Transactional Outbox Pipeline.
 * Exposes internal metrics that can be scraped by Prometheus/Grafana
 * or dumped periodically by the health endpoint.
 */
class OutboxMetrics {
  constructor() {
    this.counters = {
      published: 0,
      retries: 0,
      failed: 0,
      deadLetters: 0,
      duplicateInboxSkips: 0
    };

    // Keep track of average publish time using a moving average
    this.publishTimes = [];
    this.maxSamples = 1000;
  }

  incPublished() {
    this.counters.published++;
  }

  incRetries() {
    this.counters.retries++;
  }

  incFailed() {
    this.counters.failed++;
  }

  incDeadLetters() {
    this.counters.deadLetters++;
  }

  incDuplicateInboxSkips() {
    this.counters.duplicateInboxSkips++;
  }

  recordPublishTime(durationMs) {
    this.publishTimes.push(durationMs);
    if (this.publishTimes.length > this.maxSamples) {
      this.publishTimes.shift(); // Remove oldest sample
    }
  }

  getMetrics() {
    const sum = this.publishTimes.reduce((acc, val) => acc + val, 0);
    const averagePublishTime = this.publishTimes.length > 0 ? (sum / this.publishTimes.length).toFixed(2) : 0;

    return {
      ...this.counters,
      averagePublishTimeMs: Number(averagePublishTime),
      throughputWindowSize: this.publishTimes.length
    };
  }

  reset() {
    this.counters = {
      published: 0,
      retries: 0,
      failed: 0,
      deadLetters: 0,
      duplicateInboxSkips: 0
    };
    this.publishTimes = [];
  }
}

// Singleton export so it can be shared across Dispatcher, Middleware, and Health server
module.exports = new OutboxMetrics();
