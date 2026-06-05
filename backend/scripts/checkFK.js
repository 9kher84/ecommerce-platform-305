const { sequelize } = require('../sequelize_setup');
async function go() {
  await sequelize.authenticate();
  // What table does PurchaseRequests.userId point to?
  const [fkInfo] = await sequelize.query(`
    SELECT tc.constraint_name, kcu.column_name, ccu.table_name AS foreign_table
    FROM information_schema.table_constraints AS tc
    JOIN information_schema.key_column_usage AS kcu ON tc.constraint_name = kcu.constraint_name
    JOIN information_schema.constraint_column_usage AS ccu ON ccu.constraint_name = tc.constraint_name
    WHERE tc.constraint_type = 'FOREIGN KEY' AND tc.table_name = 'PurchaseRequests';
  `);
  console.log('PurchaseRequests FKs:');
  console.table(fkInfo);

  // Check what table users are actually stored in
  const [tables] = await sequelize.query(`SELECT tablename FROM pg_tables WHERE schemaname='public' AND tablename ILIKE '%user%';`);
  console.log('User tables:', tables.map(t => t.tablename));

  // Check the buyers we inserted:
  const [buyers] = await sequelize.query(`SELECT id, email, role FROM users WHERE email LIKE 'buyer%@testdata.com';`);
  console.log('Buyers in users table:', buyers);

  // Does the constraint point to "Users" (capitalized)?
  const [cUsers] = await sequelize.query(`SELECT id FROM "Users" LIMIT 1;`).catch(() => [null]);
  console.log('Capitalized "Users" table result:', cUsers);

  process.exit(0);
}
go();
