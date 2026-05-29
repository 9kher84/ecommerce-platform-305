const crypto = require("crypto");
const { EventLog } = require("../sequelize_setup");

async function appendEventLog({
  actorId,
  actorRole,
  entityType,
  entityId,
  actionType,
  beforeState,
  afterState,
  ipAddress,
  userAgent,
}) {
  // 1. تحضير البيانات
  const before = beforeState ? JSON.stringify(beforeState) : null;
  const after = afterState ? JSON.stringify(afterState) : null;

  // 2. إنشاء نص التوقيع (يحتوي على كل شيء حساس)
  const signaturePayload = `${actorId}|${actorRole}|${entityType}|${entityId}|${actionType}|${before}|${after}|${Date.now()}`;
  const hashSignature = crypto
    .createHash("sha256")
    .update(signaturePayload)
    .digest("hex");

  // 3. إدراج السجل
  await EventLog.create({
    actorId,
    actorRole,
    entityType,
    entityId,
    actionType,
    beforeState: beforeState || null,
    afterState: afterState || null,
    ipAddress,
    userAgent,
    hashSignature,
  });
}

module.exports = { appendEventLog };
