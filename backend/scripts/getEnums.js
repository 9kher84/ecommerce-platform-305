const { sequelize } = require('../sequelize_setup');
async function go() {
  await sequelize.authenticate();
  // Get status enum values
  const [statusVals] = await sequelize.query(
    `SELECT unnest(enum_range(NULL::"enum_PurchaseRequests_status"))::text as v;`
  );
  console.log('PR status enum values:', statusVals.map(x => x.v));

  // Get rfqStatus enum values
  try {
    const [rfqVals] = await sequelize.query(
      `SELECT unnest(enum_range(NULL::"enum_PurchaseRequests_rfqStatus"))::text as v;`
    );
    console.log('PR rfqStatus enum values:', rfqVals.map(x => x.v));
  } catch(e) { console.log('rfqStatus error:', e.message); }

  // Get sectorId info - is it FK to Categories?
  const [fkInfo] = await sequelize.query(
    `SELECT tc.constraint_name, kcu.column_name, ccu.table_name AS foreign_table, ccu.column_name AS foreign_col
     FROM information_schema.table_constraints AS tc
     JOIN information_schema.key_column_usage AS kcu ON tc.constraint_name = kcu.constraint_name
     JOIN information_schema.constraint_column_usage AS ccu ON ccu.constraint_name = tc.constraint_name
     WHERE tc.constraint_type = 'FOREIGN KEY' AND tc.table_name = 'PurchaseRequests' AND kcu.column_name = 'sectorId';`
  );
  console.log('sectorId FK info:', fkInfo);
  
  process.exit(0);
}
go();
