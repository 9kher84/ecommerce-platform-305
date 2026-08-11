const { AuditLog } = require("../sequelize_setup");
const { Op } = require("sequelize");

/**
 * Data Retention Service
 * Handles cleanup of old data and compliance policies.
 */
class DataRetentionService {
  /**
   * Deletes Audit Logs older than 90 days.
   * @returns {Promise<number>} Number of deleted records
   */
  static async cleanOldAuditLogs() {
    const retentionPeriodDays = 90;
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - retentionPeriodDays);

    console.log(
      `[DataRetention] Cleaning logs older than: ${cutoffDate.toISOString()}`,
    );

    try {
      const deletedCount = await AuditLog.destroy({
        where: {
          createdAt: {
            [Op.lt]: cutoffDate,
          },
        },
      });

      console.log(`[DataRetention] Deleted ${deletedCount} old audit logs.`);
      return deletedCount;
    } catch (error) {
      console.error("[DataRetention] Error cleaning logs:", error);
      throw error;
    }
  }

  /**
   * Permanently deletes soft-deleted draft requests older than 30 days.
   * @returns {Promise<number>} Number of deleted records
   */
  static async cleanExpiredDrafts() {
    const retentionPeriodDays = 30;
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - retentionPeriodDays);

    const { PurchaseRequest } = require("../sequelize_setup");
    const { Op } = require("sequelize");

    console.log(
      `[DataRetention] Cleaning soft-deleted drafts older than: ${cutoffDate.toISOString()}`,
    );

    try {
      const deletedCount = await PurchaseRequest.destroy({
        where: {
          deletedAt: {
            [Op.lt]: cutoffDate,
          },
          status: "draft",
        },
        force: true, // Force permanent deletion of soft-deleted records
        paranoid: false, // Bypass default Sequelize paranoid check to target soft-deleted records
      });

      console.log(`[DataRetention] Permanently deleted ${deletedCount} expired drafts.`);
      return deletedCount;
    } catch (error) {
      console.error("[DataRetention] Error cleaning expired drafts:", error);
      throw error;
    }
  }
}

module.exports = DataRetentionService;
