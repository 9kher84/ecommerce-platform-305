const { sequelize } = require('../sequelize_setup');
async function go() {
  await sequelize.authenticate();
  const [fkInfo] = await sequelize.query(`
    SELECT tc.constraint_name, kcu.column_name, ccu.table_name AS foreign_table
    FROM information_schema.table_constraints AS tc
    JOIN information_schema.key_column_usage AS kcu ON tc.constraint_name = kcu.constraint_name
    JOIN information_schema.constraint_column_usage AS ccu ON ccu.constraint_name = tc.constraint_name
    WHERE tc.constraint_type = 'FOREIGN KEY' AND tc.table_name = 'PriceQuotes';
  `);
  console.log('PriceQuotes FKs:'); console.table(fkInfo);

  // Check which status values exist
  try {
    const [sv] = await sequelize.query(`SELECT unnest(enum_range(NULL::"enum_PriceQuotes_status"))::text as v;`);
    console.log('PriceQuotes status enum:', sv.map(x=>x.v));
  } catch(e) { console.log('No status enum:', e.message.split('\n')[0]); }

  // Check sellers in "Users" table
  const [sellers] = await sequelize.query(`SELECT id, email FROM "Users" WHERE email LIKE 'seller%@testdata.com';`);
  console.log('Sellers in "Users":', sellers);

  process.exit(0);
}
go();
