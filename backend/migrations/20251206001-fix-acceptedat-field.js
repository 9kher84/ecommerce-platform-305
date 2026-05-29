"use strict";

module.exports = {
  async up(queryInterface, Sequelize) {
    console.log("=== SOVEREIGN MIGRATION: Fixing acceptedAt field ===");

    // 1. Check if column exists
    const tableInfo = await queryInterface.describeTable("PriceQuotes");

    if (!tableInfo.acceptedAt) {
      console.log("- Adding acceptedAt column...");
      await queryInterface.addColumn("PriceQuotes", "acceptedAt", {
        type: Sequelize.DATE,
        allowNull: true,
        defaultValue: null,
      });
      console.log("✅ Column added successfully");
    } else {
      console.log("✅ Column already exists, checking definition...");

      // Check if column needs modification
      if (tableInfo.acceptedAt.allowNull !== true) {
        console.log("- Fixing allowNull constraint...");
        await queryInterface.changeColumn("PriceQuotes", "acceptedAt", {
          type: Sequelize.DATE,
          allowNull: true,
          defaultValue: null,
        });
        console.log("✅ Column definition fixed");
      }
    }

    // 2. Verify the change
    const finalTableInfo = await queryInterface.describeTable("PriceQuotes");
    console.log("\n=== FINAL COLUMN STATE ===");
    console.log(
      "acceptedAt:",
      JSON.stringify(finalTableInfo.acceptedAt, null, 2),
    );
  },

  async down(queryInterface, Sequelize) {
    console.log("=== SOVEREIGN MIGRATION ROLLBACK ===");

    const tableInfo = await queryInterface.describeTable("PriceQuotes");

    if (tableInfo.acceptedAt) {
      console.log("- Removing acceptedAt column...");
      await queryInterface.removeColumn("PriceQuotes", "acceptedAt");
      console.log("✅ Column removed successfully");
    } else {
      console.log("✅ Column does not exist, nothing to rollback");
    }
  },
};
