"use strict";

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    try {
      await queryInterface.addColumn("PurchaseRequests", "deviceFingerprint", {
        type: Sequelize.STRING,
        allowNull: true,
        comment:
          "Stores the device fingerprint of the user who created the request for fraud detection.",
      });
    } catch(e) {
      console.warn("deviceFingerprint skipped:", e.message);
    }
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.removeColumn("PurchaseRequests", "deviceFingerprint");
  },
};
