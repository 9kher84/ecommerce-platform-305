const { AuditLog } = require("../sequelize_setup");

const auditService = {
  /**
   * Log an administrative action
   * @param {string} userId - ID of the user performing the action
   * @param {string} action - Action name (e.g., 'IMPERSONATE', 'UPDATE_ROLE')
   * @param {object} details - JSON details of the action
   * @param {string} resourceId - ID of affected resource
   * @param {string} resourceType - Type of affected resource
   * @param {object} req - Express request object (optional, for IP/UserAgent)
   */
  async log(
    userId,
    action,
    details,
    resourceId = null,
    resourceType = null,
    req = null,
  ) {
    try {
      const logEntry = {
        userId,
        action,
        details,
        resourceId,
        resourceType,
        ipAddress: req?.ip || null,
        userAgent: req?.headers?.["user-agent"] || null,
        timestamp: new Date(),
      };

      await AuditLog.create(logEntry);
      console.log(`[AUDIT] ${action} logged for user ${userId}`);
    } catch (error) {
      // Emergency logging fallback
      console.error("CRITICAL: FAILED TO WRITE AUDIT LOG", error);
      console.error(
        "Log Payload:",
        JSON.stringify({ userId, action, details }),
      );
    }
  },

  /**
   * Log a security alert (unauthorized access attempts)
   */
  async logSecurityAlert(userId, action, reason, req = null) {
    return this.log(
      userId,
      action,
      { reason, alert: true },
      null,
      "SECURITY",
      req,
    );
  },
};

module.exports = auditService;
