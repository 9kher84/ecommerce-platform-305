/**
 * Status Transition Service
 * الخدمة الوحيدة المسؤولة عن تغيير حالة المنشورات
 *
 * Security Rules:
 * - Only this service can change request status
 * - All transitions must follow allowed state machine
 * - Admin can force any transition
 */

const { PurchaseRequest, User } = require("../sequelize_setup");

/**
 * Allowed State Transitions
 * الانتقالات المسموحة بين الحالات
 */
const ALLOWED_TRANSITIONS = {
  draft: ["published", "cancelled"],
  published: ["negotiating", "accepted", "cancelled", "expired"],
  negotiating: ["accepted", "cancelled", "expired"],
  accepted: ["completed", "cancelled"],
  completed: [], // Terminal state
  cancelled: [], // Terminal state
  expired: ["published"], // Re-publish expired
};

/**
 * Status Transition Auditing
 * تسجيل جميع تغييرات الحالة
 */
class StatusTransitionService {
  /**
   * Validate if transition is allowed
   * @param {string} currentStatus - Current request status
   * @param {string} newStatus - Desired new status
   * @param {object} user - User attempting the transition
   * @returns {object} { allowed: boolean, reason: string }
   */
  static validateTransition(currentStatus, newStatus, user) {
    // Admin can force any transition
    if (user && user.role === "admin") {
      return { allowed: true, reason: "Admin override" };
    }

    // Check if transition is in allowed list
    const allowedNextStates = ALLOWED_TRANSITIONS[currentStatus];

    if (!allowedNextStates) {
      return {
        allowed: false,
        reason: `Invalid current status: ${currentStatus}`,
      };
    }

    if (!allowedNextStates.includes(newStatus)) {
      return {
        allowed: false,
        reason: `Transition from ${currentStatus} to ${newStatus} is not allowed. Allowed: ${allowedNextStates.join(", ")}`,
      };
    }

    return { allowed: true, reason: "Valid transition" };
  }

  /**
   * Transition request to new status
   * @param {number} requestId - Purchase Request ID
   * @param {string} newStatus - New status to transition to
   * @param {object} user - User performing the transition
   * @param {string} reason - Reason for transition (optional)
   * @returns {Promise<object>} Updated request
   */
  static async transitionStatus(requestId, newStatus, user, reason = null) {
    try {
      // Fetch the request
      const request = await PurchaseRequest.findByPk(requestId);

      if (!request) {
        throw new Error("Purchase request not found");
      }

      // Validate transition
      const validation = this.validateTransition(
        request.status,
        newStatus,
        user,
      );

      if (!validation.allowed) {
        throw new Error(`Status transition denied: ${validation.reason}`);
      }

      // Store old status for audit
      const oldStatus = request.status;

      // Update status
      request.status = newStatus;

      // Add status history
      const statusHistory = request.statusHistory || [];
      statusHistory.push({
        from: oldStatus,
        to: newStatus,
        userId: user ? user.id : null,
        userName: user ? user.name : "System",
        reason: reason || validation.reason,
        timestamp: new Date().toISOString(),
      });

      request.statusHistory = statusHistory;

      // Auto-expire if transitioning to expired
      if (newStatus === "expired") {
        request.expiryDate = new Date(); // Set to now
      }

      await request.save();

      console.log(
        `[STATUS TRANSITION] Request ${requestId}: ${oldStatus} → ${newStatus} by ${user?.name || "System"}`,
      );

      return {
        success: true,
        request,
        transition: {
          from: oldStatus,
          to: newStatus,
          reason: validation.reason,
        },
      };
    } catch (error) {
      console.error("[STATUS TRANSITION ERROR]", error.message);
      throw error;
    }
  }

  /**
   * Bulk status transition (Admin only)
   * @param {array} requestIds - Array of request IDs
   * @param {string} newStatus - New status
   * @param {object} admin - Admin user
   */
  static async bulkTransition(requestIds, newStatus, admin) {
    if (!admin || admin.role !== "admin") {
      throw new Error("Bulk transition requires admin privileges");
    }

    const results = [];

    for (const requestId of requestIds) {
      try {
        const result = await this.transitionStatus(
          requestId,
          newStatus,
          admin,
          "Bulk admin transition",
        );
        results.push({ requestId, success: true, result });
      } catch (error) {
        results.push({ requestId, success: false, error: error.message });
      }
    }

    return results;
  }

  /**
   * Get transition history for a request
   */
  static async getTransitionHistory(requestId) {
    const request = await PurchaseRequest.findByPk(requestId);

    if (!request) {
      throw new Error("Request not found");
    }

    return request.statusHistory || [];
  }

  /**
   * Get all allowed next statuses for current status
   */
  static getAllowedNextStatuses(currentStatus, user) {
    if (user && user.role === "admin") {
      return Object.keys(ALLOWED_TRANSITIONS); // Admin can go anywhere
    }

    return ALLOWED_TRANSITIONS[currentStatus] || [];
  }
}

module.exports = StatusTransitionService;
