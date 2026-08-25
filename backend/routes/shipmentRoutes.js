const express = require("express");
const router = express.Router();
const shipmentController = require("../controllers/shipmentController");
const { protect, restrictTo } = require("../middleware/authMiddleware");

// All routes under /api/v2/shipments
router.post("/preparation", protect, restrictTo("seller"), shipmentController.startPreparation);
router.post("/preparation/:poId/ready", protect, restrictTo("seller"), shipmentController.markReadyToShip);

router.post("/", protect, restrictTo("seller"), shipmentController.createShipment);
router.post("/:id/dispatch", protect, restrictTo("seller"), shipmentController.dispatchShipment);

module.exports = router;
