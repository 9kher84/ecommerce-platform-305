const express = require("express");
const router = express.Router();
const path = require("path");

router.get("/manifest.json", (req, res) => {
  res.sendFile(path.join(__dirname, "../mcp/manifest.json"));
});

router.post("/", (req, res) => {
  // Placeholder for actual MCP execution logic
  res.status(501).json({
    error:
      "MCP endpoint not fully implemented yet. Please check capabilities in /mcp/manifest.json",
  });
});

module.exports = router;
