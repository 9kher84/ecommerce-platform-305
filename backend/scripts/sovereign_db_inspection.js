const { sequelize } = require('../sequelize_setup');

async function inspectDatabase() {
    const [tables] = await sequelize.query(`
    SELECT table_name, column_name, data_type, is_nullable
    FROM information_schema.columns 
    WHERE table_schema = 'public'
    ORDER BY table_name, ordinal_position;
  `);

    const [relations] = await sequelize.query(`
    SELECT 
      conname as constraint_name,
      conrelid::regclass as source_table,
      confrelid::regclass as target_table,
      confkey as foreign_key_columns
    FROM pg_constraint 
    WHERE contype = 'f';
  `);

    return { tables, relations };
}

inspectDatabase().then(result => {
    console.log('=== DATABASE INSPECTION REPORT ===');
    console.log('Generated at:', new Date().toISOString());
    console.log('\n1. TABLES AND COLUMNS:');
    console.log(JSON.stringify(result.tables, null, 2));
    console.log('\n2. FOREIGN KEY RELATIONS:');
    console.log(JSON.stringify(result.relations, null, 2));
}).catch(console.error);
