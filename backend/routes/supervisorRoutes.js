const express = require("express");
const router = express.Router();
const { protect } = require("../middleware/authMiddleware");
const SupervisorService = require("../services/supervisorService");
const { SupervisorNotification } = require("../sequelize_setup");
const AppError = require("../utils/appError");

// Middleware to restrict to supervisor
const isSupervisor = (req, res, next) => {
  if (req.user && req.user.role === "supervisor") {
    return next();
  }
  return next(
    new AppError("Unauthorized. Only supervisors can access this.", 403),
  );
};

router.use(protect);
router.use(isSupervisor);

// GET /api/supervisor/deals
router.get("/deals", async (req, res, next) => {
  try {
    const deals = await SupervisorService.getSupervisorDeals(req.user.id);
    res.json({ success: true, data: deals });
  } catch (err) {
    next(err);
  }
});

// GET /api/supervisor/commissions
router.get("/commissions", async (req, res, next) => {
  try {
    const commissions = await SupervisorService.getSupervisorCommissions(
      req.user.id,
      req.query,
    );
    res.json({ success: true, data: commissions });
  } catch (err) {
    next(err);
  }
});

// GET /api/supervisor/notifications
router.get("/notifications", async (req, res, next) => {
  try {
    const notifications = await SupervisorNotification.findAll({
      where: { supervisor_id: req.user.id },
      order: [["created_at", "DESC"]],
    });
    res.json({ success: true, data: notifications });
  } catch (err) {
    next(err);
  }
});

// PUT /api/supervisor/notifications/:id/read
router.put("/notifications/:id/read", async (req, res, next) => {
  try {
    const notif = await SupervisorNotification.findOne({
      where: { id: req.params.id, supervisor_id: req.user.id },
    });
    if (!notif)
      return res.status(404).json({ success: false, error: "Not found" });

    notif.read = true;
    await notif.save();
    res.json({ success: true, data: notif });
  } catch (err) {
    next(err);
  }
});

// GET /api/supervisor/reports/custom
router.get("/reports/custom", async (req, res, next) => {
  try {
    // Placeholder for custom reports
    res.json({ success: true, data: { message: "No custom reports yet" } });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
