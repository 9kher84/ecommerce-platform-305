const { sequelize } = require('../sequelize_setup');

async function inspect() {
  await sequelize.authenticate();
  
  const tables = ['PurchaseRequests', 'PriceQuotes', 'Messages', 'Notifications', 'Categories'];
  
  for (const table of tables) {
    const [cols] = await sequelize.query(
      `SELECT column_name, data_type, is_nullable, column_default
       FROM information_schema.columns 
       WHERE table_name = '${table}' 
       ORDER BY ordinal_position;`
    );
    console.log(`\n=== ${table} ===`);
    console.table(cols.map(c => ({ col: c.column_name, type: c.data_type, nullable: c.is_nullable, default: c.column_default?.substring(0,30) })));
  }
  
  process.exit(0);
}
inspect();
