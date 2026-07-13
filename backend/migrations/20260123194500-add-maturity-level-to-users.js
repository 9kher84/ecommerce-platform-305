"use strict";

module.exports = {
  up: async (queryInterface, Sequelize) => {
    // 1. Add column to Users table
    // Since we are using ENUM, we need to create the type first if it doesn't exist,
    // but in many setups addColumn with ENUM works if Sequelize handles it.
    // However, safest for Postgres is to check/create type.

    try {
      await queryInterface.addColumn("Users", "maturity_level", {
        type: Sequelize.ENUM("BASIC", "GUIDED", "ADVANCED"),
        defaultValue: "BASIC",
        allowNull: false,
      });
    } catch(e) { console.warn('maturity_level skipped:', e.message); }
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.removeColumn("Users", "maturity_level");
    // Drop the ENUM type if necessary (Postgres specific)
    // await queryInterface.sequelize.query('DROP TYPE IF EXISTS "enum_Users_maturity_level";');
  },
};
