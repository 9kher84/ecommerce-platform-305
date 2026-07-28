'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.sequelize.query('TRUNCATE TABLE "Awards" CASCADE;');
    
    await queryInterface.addColumn('Awards', 'buyerOrganizationId', {
      type: Sequelize.UUID,
      allowNull: false,
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.removeColumn('Awards', 'buyerOrganizationId');
  }
};
