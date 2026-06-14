const { sequelize } = require('../sequelize_setup');

async function go() {
  await sequelize.authenticate();

  // All users from testdata.com domain in both tables
  const [u1] = await sequelize.query(
    `SELECT email, role, "isActive" FROM users ORDER BY role, email;`
  );
  console.log('\n=== جدول users (lowercase) ===');
  console.table(u1);

  process.exit(0);
}
go();
