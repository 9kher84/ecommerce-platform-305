const { getRedisClient } = require("../config/redis");
const redis = getRedisClient();

exports.toggleKillSwitch = async (req, res) => {
  const { secret, active } = req.body;
  if (secret !== process.env.KILL_SWITCH_SECRET)
    return res.status(401).json({ error: "Invalid secret" });
  await redis.set("maintenance_mode:active", active ? "true" : "false");
  res.json({ success: true, maintenance: active });
};
