const { Sequelize } = require('sequelize');

async function checkProdPerm() {
  const sequelize = new Sequelize('postgresql://neondb_owner:npg_hudwpP4y8bvU@ep-rapid-river-ap7l6xha-pooler.c-7.us-east-1.aws.neon.tech/neondb?sslmode=require', {
    dialect: 'postgres',
    logging: false
  });

  try {
    await sequelize.authenticate();
    
    // Check buyer1@test.com roles
    const [roles] = await sequelize.query(`
      SELECT ur."userId", r.name 
      FROM user_roles ur
      JOIN roles r ON r.id = ur."roleId"
      JOIN users u ON u.id = ur."userId"
      WHERE u.email = 'buyer1@test.com'
    `);
    console.log("buyer1 roles in user_roles:", roles);

    const [allUserRoles] = await sequelize.query(`SELECT COUNT(*) as count FROM user_roles`);
    console.log("Total user_roles count:", allUserRoles[0].count);
    
    const [allUsers] = await sequelize.query(`SELECT COUNT(*) as count FROM users`);
    console.log("Total users count:", allUsers[0].count);

    process.exit(0);
  } catch (err) {
    console.error("❌ Fatal Error:", err.message);
    process.exit(1);
  }
}

checkProdPerm();
