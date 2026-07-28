const { Op } = require('sequelize');
const { sequelize } = require('../../sequelize_setup');

class OutboxRetentionJob {
  constructor(options = {}) {
    this.retentionDaysPublished = options.retentionDaysPublished || 30;
    this.retentionDaysDeadLetter = options.retentionDaysDeadLetter || 180;
    this.batchSize = options.batchSize || 1000;
  }

  /**
   * Runs the cleanup logic.
   * Finds records older than the retention threshold and deletes them.
   */
  async run() {
    console.log(`[OutboxRetentionJob] Starting cleanup task...`);
    const startTime = Date.now();
    let totalDeleted = 0;

    try {
      if (!sequelize.models.OutboxEvent) {
        console.warn(`[OutboxRetentionJob] OutboxEvent model not found. Skipping.`);
        return;
      }

      const publishedCutoff = new Date();
      publishedCutoff.setDate(publishedCutoff.getDate() - this.retentionDaysPublished);

      const deadLetterCutoff = new Date();
      deadLetterCutoff.setDate(deadLetterCutoff.getDate() - this.retentionDaysDeadLetter);

      console.log(`[OutboxRetentionJob] Published Cutoff: ${publishedCutoff.toISOString()}`);
      console.log(`[OutboxRetentionJob] Dead Letter Cutoff: ${deadLetterCutoff.toISOString()}`);

      let deletedInBatch = 0;
      
      // Cleanup Published Events
      do {
        deletedInBatch = await sequelize.models.OutboxEvent.destroy({
          where: {
            status: 'PUBLISHED',
            savedAt: { [Op.lt]: publishedCutoff }
          },
          limit: this.batchSize
        });
        totalDeleted += deletedInBatch;
      } while (deletedInBatch === this.batchSize);

      // Cleanup Dead Letter Events
      do {
        deletedInBatch = await sequelize.models.OutboxEvent.destroy({
          where: {
            status: 'DEAD_LETTER',
            savedAt: { [Op.lt]: deadLetterCutoff }
          },
          limit: this.batchSize
        });
        totalDeleted += deletedInBatch;
      } while (deletedInBatch === this.batchSize);

      console.log(`[OutboxRetentionJob] Cleanup complete. Deleted ${totalDeleted} records in ${Date.now() - startTime}ms.`);
    } catch (err) {
      console.error(`[OutboxRetentionJob] Error running cleanup:`, err);
    }
  }
}

module.exports = OutboxRetentionJob;

// Standalone execution script
if (require.main === module) {
  const job = new OutboxRetentionJob();
  job.run().then(() => {
    console.log('[OutboxRetentionJob] Exiting.');
    process.exit(0);
  });
}
