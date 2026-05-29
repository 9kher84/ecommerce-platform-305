/**
 * Request Status Controller
 * Secure endpoint for manual status transitions
 */

const StatusTransitionService = require("../services/statusTransitionService");
const { PurchaseRequest } = require("../sequelize_setup");

/**
 * Update request status
 * PUT /api/requests/:id/status
 */
exports.updateRequestStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status, reason } = req.body;
    const authContext = req.auth || { actor: req.user, principal: req.user };

    // Validate inputs
    if (!status) {
      return res.status(400).json({
        success: false,
        message: "الحالة الجديدة مطلوبة (status is required)",
      });
    }

    // Use RequestService for secure transition (Audited)
    const request =
      await require("../services/requestService").transitionRequestStatus(
        id,
        status,
        authContext,
        reason || `Manual status update by ${authContext.actor.name}`,
      );

    try {
      const { AuditLog } = require("../sequelize_setup");
      await AuditLog.create({
        user_id: req.user.id,
        organization_id: request.organization_id || null,
        action: "STATUS_CHANGE",
        entity_type: "PurchaseRequest",
        entity_id: request.id,
        new_data: { status },
      });
    } catch (e) {}

    res.status(200).json({
      success: true,
      message: `Request status updated to ${status}`,
      data: {
        request,
      },
    });
  } catch (error) {
    console.error("[updateRequestStatus] Error:", error);

    res.status(error.message.includes("Invalid Status") ? 400 : 500).json({
      success: false,
      message: error.message || "Failed to update request status",
    });
  }
};

/**
 * Get transition history for a request
 * GET /api/requests/:id/status-history
 */
exports.getStatusHistory = async (req, res) => {
  try {
    const { id } = req.params;

    const history = await StatusTransitionService.getTransitionHistory(id);

    res.status(200).json({
      success: true,
      data: { history },
    });
  } catch (error) {
    console.error("[getStatusHistory] Error:", error);
    res.status(500).json({
      success: false,
      message: error.message || "Failed to fetch status history",
    });
  }
};

/**
 * Get allowed next statuses for a request
 * GET /api/requests/:id/allowed-statuses
 */
exports.getAllowedStatuses = async (req, res) => {
  try {
    const { id } = req.params;
    const user = req.user;

    const request = await PurchaseRequest.findByPk(id);

    if (!request) {
      return res.status(404).json({
        success: false,
        message: "Request not found",
      });
    }

    const allowedStatuses = StatusTransitionService.getAllowedNextStatuses(
      request.status,
      user,
    );

    res.status(200).json({
      success: true,
      data: {
        currentStatus: request.status,
        allowedNextStatuses: allowedStatuses,
      },
    });
  } catch (error) {
    console.error("[getAllowedStatuses] Error:", error);
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};
