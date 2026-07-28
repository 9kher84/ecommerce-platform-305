const fs = require('fs');

async function run() {
  const { sequelize } = require('./sequelize_setup');
  const models = sequelize.models;

  const report = {};

  for (const [modelName, model] of Object.entries(models)) {
    if (!model || !model.options) continue;

    const m = {
      modelName: modelName,
      physicalTable: model.tableName,
      explicitTableName: model.options.tableName,
      associations: [],
      foreignKeys: [],
      indexes: model.options.indexes || [],
      hooks: Object.keys(model.options.hooks || {}),
      scopes: Object.keys(model.options.scopes || {})
    };

    if (model.associations) {
      for (const [assocName, assoc] of Object.entries(model.associations)) {
        m.associations.push({
          name: assocName,
          type: assoc.associationType,
          target: assoc.target.name,
          foreignKey: assoc.foreignKey,
          sourceKey: assoc.sourceKey
        });
        if (assoc.foreignKey) {
          m.foreignKeys.push(assoc.foreignKey);
        }
      }
    }

    report[modelName] = m;
  }

  fs.writeFileSync('model_report.json', JSON.stringify(report, null, 2));
  console.log('model_report.json generated with ' + Object.keys(report).length + ' models');
  process.exit(0);
}

run().catch(console.error);
