const { sequelize } = require('../sequelize_setup');
const fs = require('fs');
const path = require('path');

const models = {};

fs.readdirSync(__dirname)
  .filter(file => file !== 'index.js' && file.endsWith('.js'))
  .forEach(file => {
    const model = require(path.join(__dirname, file));
    if (model && model.name) {
      models[model.name] = model;
    }
  });

models.sequelize = sequelize;

module.exports = models;
