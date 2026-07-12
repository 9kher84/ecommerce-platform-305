'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up (queryInterface, Sequelize) {
    // 1. Create AssetTypes table
    await queryInterface.createTable('AssetTypes', {
      id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true,
      },
      code: {
        type: Sequelize.STRING,
        allowNull: false,
        unique: true,
      },
      name: {
        type: Sequelize.JSON,
        allowNull: false,
      },
      description: {
        type: Sequelize.JSON,
        allowNull: true,
      },
      isActive: {
        type: Sequelize.BOOLEAN,
        defaultValue: true,
      },
      createdAt: {
        type: Sequelize.DATE,
        allowNull: false,
      },
      updatedAt: {
        type: Sequelize.DATE,
        allowNull: false,
      }
    });

    // 2. Add ownerOrganizationId to Products
    await queryInterface.addColumn('Products', 'ownerOrganizationId', {
      type: Sequelize.UUID,
      allowNull: true,
      references: {
        model: 'organizations',
        key: 'id'
      },
      onUpdate: 'CASCADE',
      onDelete: 'SET NULL'
    });

    // 3. Add assetTypeId to Products
    await queryInterface.addColumn('Products', 'assetTypeId', {
      type: Sequelize.INTEGER,
      allowNull: true,
      references: {
        model: 'AssetTypes',
        key: 'id'
      },
      onUpdate: 'CASCADE',
      onDelete: 'SET NULL'
    });

    // 4. Add assetTypeId to PurchaseRequests
    await queryInterface.addColumn('PurchaseRequests', 'assetTypeId', {
      type: Sequelize.INTEGER,
      allowNull: true,
      references: {
        model: 'AssetTypes',
        key: 'id'
      },
      onUpdate: 'CASCADE',
      onDelete: 'SET NULL'
    });
  },

  async down (queryInterface, Sequelize) {
    await queryInterface.removeColumn('PurchaseRequests', 'assetTypeId');
    await queryInterface.removeColumn('Products', 'assetTypeId');
    await queryInterface.removeColumn('Products', 'ownerOrganizationId');
    await queryInterface.dropTable('AssetTypes');
  }
};
