const { AdminActionLog } = require("../sequelize_setup");

async function logAdminAction(
  adminId,
  actionType,
  targetType,
  targetId,
  details,
  ip,
) {
  await AdminActionLog.create({
    adminId,
    actionType,
    targetType,
    targetId,
    details,
    ipAddress: ip,
  });
}

module.exports = { logAdminAction };
