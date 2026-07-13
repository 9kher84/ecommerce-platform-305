'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    try {
      await queryInterface.sequelize.query('CREATE SEQUENCE IF NOT EXISTS "invoice_number_seq" START 100000;');
    } catch (e) {
      console.warn("Sequence creation skipped or failed:", e.message);
    }
  },

  down: async (queryInterface, Sequelize) => {
    try {
      await queryInterface.sequelize.query('DROP SEQUENCE IF EXISTS "invoice_number_seq";');
    } catch (e) {}
  }
};
