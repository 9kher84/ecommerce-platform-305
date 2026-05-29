const { Sanction } = require("../sequelize_setup");
const { Op } = require("sequelize");

async function applySanction(userId, type, reason, durationMinutes = null) {
  let endDate = null;
  if (durationMinutes) {
    endDate = new Date(Date.now() + durationMinutes * 60000);
  }

  await Sanction.create({
    userId,
    sanctionType: type,
    reason,
    startDate: new Date(),
    endDate,
    active: true,
  });
}

async function getActiveSanctions(userId, type) {
  return await Sanction.findOne({
    where: {
      userId,
      sanctionType: type,
      active: true,
      [Op.or]: [{ endDate: { [Op.gt]: new Date() } }, { endDate: null }],
    },
  });
}

async function isShadowRestricted(userId) {
  const sanction = await getActiveSanctions(userId, "shadow_restriction");
  return !!sanction;
}

async function isSuspended(userId) {
  const sanction = await getActiveSanctions(userId, "temporary_suspension");
  return !!sanction;
}

async function isBanned(userId) {
  const sanction = await getActiveSanctions(userId, "permanent_ban");
  return !!sanction;
}

module.exports = { applySanction, isShadowRestricted, isSuspended, isBanned };
