const { sequelize, User, Role } = require("../sequelize_setup");

async function assign() {
  await sequelize.authenticate();
  const buyerRole = await Role.findOne({ where: { name: 'buyer' } });
  if (!buyerRole) {
     console.log("No buyer role found.");
     process.exit(1);
  }
  const users = await User.findAll({ where: { role: 'buyer', name: { [require('sequelize').Op.like]: 'Load User %' } } });
  
  const userRoles = users.map(u => ({
    userId: u.id,
    roleId: buyerRole.id
  }));
  
  const { UserRole } = require("../sequelize_setup");
  await UserRole.bulkCreate(userRoles, { ignoreDuplicates: true });
  console.log(`Assigned role to ${users.length} users.`);
  process.exit(0);
}
assign();
