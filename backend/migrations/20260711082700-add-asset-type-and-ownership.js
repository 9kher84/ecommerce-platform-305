'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up (queryInterface, Sequelize) {
    // 1. Create AssetTypes table
    try { 
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
    } catch(e) { console.warn('AssetTypes skipped', e.message); }

    // 2. Add ownerOrganizationId to Products
    try { 
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
    } catch(e) { console.warn('ownerOrganizationId skipped', e.message); }

    // 3. Add assetTypeId to Products
    try { 
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
    } catch(e) { console.warn('assetTypeId skipped', e.message); }

    // 4. Add assetTypeId to PurchaseRequests
    try { 
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
    } catch(e) { console.warn('assetTypeId PR skipped', e.message); }
  },

  async down (queryInterface, Sequelize) {
    try { await queryInterface.removeColumn('PurchaseRequests', 'assetTypeId'); } catch(e) {}
    try { await queryInterface.removeColumn('Products', 'assetTypeId'); } catch(e) {}
    try { await queryInterface.removeColumn('Products', 'ownerOrganizationId'); } catch(e) {}
    try { await queryInterface.dropTable('AssetTypes'); } catch(e) {}
  }
};
