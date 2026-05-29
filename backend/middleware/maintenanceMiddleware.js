const { getRedisClient } = require("../config/redis");
const redis = getRedisClient();

module.exports = async (req, res, next) => {
  if (req.path === "/api/admin/kill-switch") return next();
  const isMaintenance = await redis.get("maintenance_mode:active");
  if (isMaintenance === "true") {
    return res.status(503).json({ error: "System under maintenance" });
  }
  next();
};
