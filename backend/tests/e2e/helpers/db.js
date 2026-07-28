const { User, Organization, PurchaseRequest, sequelize } = require('../../../sequelize_setup');
const { v4: uuidv4 } = require('uuid');
const { Op } = require('sequelize');

async function cleanIsolatedData(prefix) {
  // Only clean data created by the tests (users starting with prefix)
  const users = await User.findAll({ where: { email: { [Op.like]: `${prefix}%` } } });
  if (users.length === 0) return;

  const userIds = users.map(u => u.id);
  
  try {
    await sequelize.query(`DELETE FROM "event_logs" WHERE "actor_id" IN (:userIds)`, { replacements: { userIds } });
    await sequelize.query(`DELETE FROM "Notifications" WHERE "userId" IN (:userIds)`, { replacements: { userIds } });
    await sequelize.query(`DELETE FROM "organization_users" WHERE user_id IN (:userIds)`, { replacements: { userIds } });
    await sequelize.query(`DELETE FROM "Users" WHERE id IN (:userIds)`, { replacements: { userIds } });
  } catch (err) {
    console.error("Cleanup error:", err.message);
  }
}

module.exports = {
  cleanIsolatedData
};
