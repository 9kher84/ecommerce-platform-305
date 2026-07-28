const express = require("express");
const router = express.Router();
const agentGatewayController = require("../controllers/agentGatewayController");

router.post("/chat", agentGatewayController.handleAgentChat);

module.exports = router;
