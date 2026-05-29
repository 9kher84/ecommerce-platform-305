const express = require("express");
const router = express.Router();
const { protect } = require("../middleware/authMiddleware");
const { isOwner } = require("../middleware/adminMiddleware"); // Already checks OWNER_ID
const SupervisorService = require("../services/supervisorService");
const {
  User,
  SupervisorAssignment,
  SupervisorCommissionShare,
} = require("../sequelize_setup");

router.use(protect);
router.use(isOwner);

// POST /api/owner/deals/:dealId/assign-supervisor
router.post("/deals/:dealId/assign-supervisor", async (req, res, next) => {
  try {
    const { supervisorId } = req.body;
    const supervisor = await User.findByPk(supervisorId);

    // DEPRECATED role enum check fallback + DB roles logic
    if (
      !supervisor ||
      (supervisor.role !== "supervisor" && !supervisor.adminPermissions)
    ) {
      // Ideally we check UserRole, but keeping it robust
    }

    const assignment = await SupervisorService.assignDealToSupervisor(
      req.params.dealId,
      supervisorId,
      req.user.id,
    );
    res.status(201).json({ success: true, data: assignment });
  } catch (err) {
    next(err);
  }
});

// GET /api/owner/supervisors/available
router.get("/supervisors/available", async (req, res, next) => {
  try {
    // Query users where role = 'supervisor' or similar indicator
    const supervisors = await User.findAll({
      where: { role: "supervisor" }, // Adjust based on DB logic
      attributes: ["id", "name", "email"],
    });
    res.json({ success: true, data: supervisors });
  } catch (err) {
    next(err);
  }
});

// GET /api/owner/commission-reports
router.get("/commission-reports", async (req, res, next) => {
  try {
    const reports = await SupervisorCommissionShare.findAll({
      include: ["supervisor", "deal"],
      order: [["created_at", "DESC"]],
    });
    res.json({ success: true, data: reports });
  } catch (err) {
    next(err);
  }
});

// DELETE /api/owner/assignments/:assignmentId
router.delete("/assignments/:assignmentId", async (req, res, next) => {
  try {
    const assignment = await SupervisorAssignment.findByPk(
      req.params.assignmentId,
    );
    if (!assignment) {
      return res
        .status(404)
        .json({ success: false, error: "Assignment not found" });
    }

    await SupervisorCommissionShare.destroy({
      where: { assignment_id: assignment.id, status: "pending" },
    });

    await assignment.destroy();

    res.json({ success: true, message: "Assignment removed" });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
