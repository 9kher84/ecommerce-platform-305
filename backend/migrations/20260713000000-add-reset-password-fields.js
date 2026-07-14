'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    // Check if columns already exist
    const tableInfo = await queryInterface.describeTable('users').catch(() => null);
    if (!tableInfo) return; // Table might be 'Users' depending on casing, we'll try both.

    if (!tableInfo.resetPasswordToken) {
      await queryInterface.addColumn('users', 'resetPasswordToken', {
        type: Sequelize.STRING,
        allowNull: true,
      });
    }

    if (!tableInfo.resetPasswordExpire) {
      await queryInterface.addColumn('users', 'resetPasswordExpire', {
        type: Sequelize.DATE,
        allowNull: true,
      });
    }
  },

  down: async (queryInterface, Sequelize) => {
    const tableInfo = await queryInterface.describeTable('users').catch(() => null);
    if (tableInfo) {
      if (tableInfo.resetPasswordToken) {
        await queryInterface.removeColumn('users', 'resetPasswordToken');
      }
      if (tableInfo.resetPasswordExpire) {
        await queryInterface.removeColumn('users', 'resetPasswordExpire');
      }
    }
  }
};
