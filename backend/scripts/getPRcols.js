const { sequelize } = require('../sequelize_setup');

async function go() {
  await sequelize.authenticate();
  const [r] = await sequelize.query(
    `SELECT column_name FROM information_schema.columns WHERE table_name='PurchaseRequests' ORDER BY ordinal_position;`
  );
  console.log('PurchaseRequests columns:', r.map(c => c.column_name).join(', '));
  process.exit(0);
}
go();
