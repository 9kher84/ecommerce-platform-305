const fs = require('fs');

async function run() {
  const { sequelize } = require('./sequelize_setup');
  
  console.log('Testing DB Connection...');
  try {
    await sequelize.authenticate();
    console.log('Database connection successful.');
  } catch (err) {
    console.error('Unable to connect to the database:', err);
    // Proceed anyway using just the model definitions
  }

  const models = sequelize.models;
  const report = {};

  for (const [modelName, model] of Object.entries(models)) {
    if (!model || !model.options) continue;
    const opts = model.options;
    
    report[modelName] = {
      modelName: model.name,
      physicalTable: model.tableName,
      schema: opts.schema || 'public',
      freezeTableName: !!opts.freezeTableName,
      underscored: !!opts.underscored,
      timestamps: !!opts.timestamps,
      paranoid: !!opts.paranoid,
      actualSqlGenerated: `SELECT ... FROM ${sequelize.queryInterface.queryGenerator.quoteTable(model.tableName)} AS ${sequelize.queryInterface.queryGenerator.quoteIdentifier(model.name)}`,
      requiresQuoting: model.tableName !== model.tableName.toLowerCase()
    };
  }

  fs.writeFileSync('audit_models.json', JSON.stringify(report, null, 2));
  console.log('audit_models.json generated');

  // Query actual database tables
  let dbTables = [];
  const duplicateAnalysis = {};
  
  try {
    const [tables] = await sequelize.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_type = 'BASE TABLE'
    `);
    dbTables = tables.map(t => t.table_name);
    
    // Group by lowercase
    const lowerMap = {};
    for (const t of dbTables) {
      const lower = t.toLowerCase();
      if (!lowerMap[lower]) lowerMap[lower] = [];
      lowerMap[lower].push(t);
    }
    
    for (const [lower, names] of Object.entries(lowerMap)) {
      if (names.length > 1) {
        duplicateAnalysis[lower] = { forms: names, counts: {} };
        for (const name of names) {
          try {
            const [result] = await sequelize.query(`SELECT count(*) as total FROM "${name}"`);
            duplicateAnalysis[lower].counts[name] = parseInt(result[0].total, 10);
          } catch (e) {
            duplicateAnalysis[lower].counts[name] = 'ERROR';
          }
        }
      }
    }
  } catch(e) {
    console.error('Error fetching real DB tables:', e);
  }

  const reality = {
    dbTables,
    duplicateAnalysis
  };

  fs.writeFileSync('audit_db_reality.json', JSON.stringify(reality, null, 2));
  console.log('audit_db_reality.json generated');
  
  process.exit(0);
}

run().catch(err => {
  console.error(err);
  process.exit(1);
});
