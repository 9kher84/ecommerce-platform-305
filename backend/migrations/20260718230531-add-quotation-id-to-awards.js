'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up (queryInterface, Sequelize) {
    await queryInterface.sequelize.query('TRUNCATE TABLE "Awards" CASCADE;');
    await queryInterface.addColumn('Awards', 'quotationId', {
      type: Sequelize.UUID,
      allowNull: false,
      unique: true // This enforces the idempotency at the DB level!
    });
  },

  async down (queryInterface, Sequelize) {
    await queryInterface.removeColumn('Awards', 'quotationId');
  }
};
