"use strict";

module.exports = {
  up: async (queryInterface, Sequelize) => {
    try {
      try {
        // 1. Add 'type' column to Categories
        await queryInterface.addColumn(
          "Categories",
          "type",
          {
            type: Sequelize.ENUM("SECTOR", "PRODUCT_CATEGORY"),
            defaultValue: "PRODUCT_CATEGORY",
            allowNull: false,
          },
        );
      } catch (e) { console.warn('Categories.type skipped:', e.message); }

      try {
        // 2. Add 'parentId' column to Categories
        await queryInterface.addColumn(
          "Categories",
          "parentId",
          {
            type: Sequelize.INTEGER,
            allowNull: true,
            references: {
              model: "Categories",
              key: "id",
            },
            onUpdate: "CASCADE",
            onDelete: "SET NULL",
          },
        );
      } catch(e) { console.warn('Categories.parentId skipped:', e.message); }

      // 3. Create UserCategories table (Junction)
      await queryInterface.createTable(
        "UserCategories",
        {
          createdAt: {
            allowNull: false,
            type: Sequelize.DATE,
          },
          updatedAt: {
            allowNull: false,
            type: Sequelize.DATE,
          },
          userId: {
            type: Sequelize.UUID,
            primaryKey: true,
            references: {
              model: "Users",
              key: "id",
            },
            onDelete: "CASCADE",
            onUpdate: "CASCADE",
          },
          categoryId: {
            type: Sequelize.INTEGER,
            primaryKey: true,
            references: {
              model: "Categories",
              key: "id",
            },
            onDelete: "CASCADE",
            onUpdate: "CASCADE",
          },
        },
      );

      // 4. Data Migration: Direct SQL Update for robustness
      await queryInterface.sequelize.query(
        'UPDATE "Categories" SET "type" = \'PRODUCT_CATEGORY\' WHERE "type" IS NULL',
      );
    } catch (err) {
      throw err;
    }
  },

  down: async (queryInterface, Sequelize) => {
    const transaction = await queryInterface.sequelize.transaction();
    try {
      await queryInterface.dropTable("UserCategories");
      await queryInterface.removeColumn("Categories", "parentId", {
        transaction,
      });
      await queryInterface.removeColumn("Categories", "type");
      // Clean up ENUM (Postgres specific if needed)
      await queryInterface.sequelize.query(
        'DROP TYPE IF EXISTS "enum_Categories_type";',
      );
    } catch (err) {
      throw err;
    }
  },
};
