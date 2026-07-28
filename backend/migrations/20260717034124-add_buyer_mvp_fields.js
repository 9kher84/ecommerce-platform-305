'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    // We add the columns one by one
    await queryInterface.addColumn('PurchaseRequests', 'delivery_region', {
      type: Sequelize.STRING,
      allowNull: true,
    });
    await queryInterface.addColumn('PurchaseRequests', 'project_address', {
      type: Sequelize.STRING,
      allowNull: true,
    });
    await queryInterface.addColumn('PurchaseRequests', 'tender_type', {
      type: Sequelize.ENUM('PUBLIC', 'PRIVATE', 'INVITATION'),
      allowNull: true,
    });
    await queryInterface.addColumn('PurchaseRequests', 'pricing_method', {
      type: Sequelize.ENUM('OPEN', 'FIXED_BUDGET'),
      allowNull: true,
    });
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.removeColumn('PurchaseRequests', 'delivery_region');
    await queryInterface.removeColumn('PurchaseRequests', 'project_address');
    await queryInterface.removeColumn('PurchaseRequests', 'tender_type');
    await queryInterface.removeColumn('PurchaseRequests', 'pricing_method');
    // We also need to drop the enums if PostgreSQL
    await queryInterface.sequelize.query('DROP TYPE IF EXISTS "enum_PurchaseRequests_tender_type";').catch(() => {});
    await queryInterface.sequelize.query('DROP TYPE IF EXISTS "enum_PurchaseRequests_pricing_method";').catch(() => {});
  }
};
