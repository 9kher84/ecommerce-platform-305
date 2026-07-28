const express = require("express");
const router = express.Router();
const organizationController = require("../controllers/organizationController");

router.get("/metrics", organizationController.getOrganizationMetrics);
router.get("/members", organizationController.getMembers);
router.get("/agents", organizationController.getAgents);

module.exports = router;
