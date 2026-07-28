const { sequelize } = require('../sequelize_setup');
const fs = require('fs');
const path = require('path');

const models = {};

fs.readdirSync(__dirname)
  .filter(file => file !== 'index.js' && file.endsWith('.js'))
  .forEach(file => {
    const modelDefiner = require(path.join(__dirname, file));
    const model = modelDefiner(sequelize, require('sequelize').DataTypes);
    models[model.name] = model;
  });

models.sequelize = sequelize;

module.exports = models;
