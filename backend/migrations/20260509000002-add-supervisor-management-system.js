"use strict";

module.exports = {
  up: async (queryInterface, Sequelize) => {
    // 1. Add columns to deals table
    try {
      await queryInterface.addColumn("Deals", "owner_commission_share", {
        type: Sequelize.DECIMAL(5, 2),
        defaultValue: 2.0,
      });
    } catch (e) {
      console.log("owner_commission_share exists");
    }
    try {
      await queryInterface.addColumn("Deals", "supervisor_1_share", {
        type: Sequelize.DECIMAL(5, 2),
        defaultValue: 0.5,
      });
    } catch (e) {
      console.log("supervisor_1_share exists");
    }
    try {
      await queryInterface.addColumn("Deals", "supervisor_2_share", {
        type: Sequelize.DECIMAL(5, 2),
        defaultValue: 0.5,
      });
    } catch (e) {
      console.log("supervisor_2_share exists");
    }

    // 2. Create supervisor_assignments table
    await queryInterface.createTable("supervisor_assignments", {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        primaryKey: true,
      },
      deal_id: {
        type: Sequelize.UUID,
        allowNull: false,
        references: { model: "Deals", key: "id" },
        onDelete: "CASCADE",
      },
      supervisor_id: {
        type: Sequelize.UUID,
        allowNull: false,
        references: { model: "users", key: "id" },
        onDelete: "CASCADE",
      },
      assigned_by: {
        type: Sequelize.UUID,
        allowNull: false,
        references: { model: "users", key: "id" },
      },
      platform_share: {
        type: Sequelize.DECIMAL(5, 2),
        allowNull: false,
        defaultValue: 2.0,
      },
      supervisor_share: {
        type: Sequelize.DECIMAL(5, 2),
        allowNull: false,
        defaultValue: 0.5,
      },
      created_at: {
        type: Sequelize.DATE,
        defaultValue: Sequelize.NOW,
      },
      updated_at: {
        type: Sequelize.DATE,
        defaultValue: Sequelize.NOW,
      },
    });

    // 3. Create supervisor_commission_shares table
    await queryInterface.createTable("supervisor_commission_shares", {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        primaryKey: true,
      },
      assignment_id: {
        type: Sequelize.UUID,
        allowNull: false,
        references: { model: "supervisor_assignments", key: "id" },
        onDelete: "CASCADE",
      },
      supervisor_id: {
        type: Sequelize.UUID,
        allowNull: false,
        references: { model: "users", key: "id" },
      },
      deal_id: {
        type: Sequelize.UUID,
        allowNull: false,
        references: { model: "Deals", key: "id" },
      },
      amount: {
        type: Sequelize.DECIMAL(10, 2),
        allowNull: false,
      },
      status: {
        type: Sequelize.STRING(20),
        defaultValue: "pending",
      },
      paid_at: {
        type: Sequelize.DATE,
      },
      created_at: {
        type: Sequelize.DATE,
        defaultValue: Sequelize.NOW,
      },
      updated_at: {
        type: Sequelize.DATE,
        defaultValue: Sequelize.NOW,
      },
    });

    // 4. Create supervisor_notifications table
    await queryInterface.createTable("supervisor_notifications", {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        primaryKey: true,
      },
      supervisor_id: {
        type: Sequelize.UUID,
        allowNull: false,
        references: { model: "users", key: "id" },
        onDelete: "CASCADE",
      },
      type: {
        type: Sequelize.STRING(50),
        allowNull: false,
      },
      title: {
        type: Sequelize.STRING(255),
        allowNull: false,
      },
      message: {
        type: Sequelize.TEXT,
        allowNull: false,
      },
      priority: {
        type: Sequelize.STRING(20),
        defaultValue: "normal",
      },
      deal_id: {
        type: Sequelize.UUID,
        references: { model: "Deals", key: "id" },
        onDelete: "SET NULL",
      },
      read: {
        type: Sequelize.BOOLEAN,
        defaultValue: false,
      },
      metadata: {
        type: Sequelize.JSONB,
      },
      created_at: {
        type: Sequelize.DATE,
        defaultValue: Sequelize.NOW,
      },
      updated_at: {
        type: Sequelize.DATE,
        defaultValue: Sequelize.NOW,
      },
    });

    // 5. Create region_assignments table
    await queryInterface.createTable("region_assignments", {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        primaryKey: true,
      },
      supervisor_id: {
        type: Sequelize.UUID,
        allowNull: false,
        references: { model: "users", key: "id" },
        onDelete: "CASCADE",
      },
      region_name: {
        type: Sequelize.STRING(100),
        allowNull: false,
      },
      assigned_by: {
        type: Sequelize.UUID,
        references: { model: "users", key: "id" },
      },
      is_active: {
        type: Sequelize.BOOLEAN,
        defaultValue: true,
      },
      created_at: {
        type: Sequelize.DATE,
        defaultValue: Sequelize.NOW,
      },
      updated_at: {
        type: Sequelize.DATE,
        defaultValue: Sequelize.NOW,
      },
    });
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.dropTable("region_assignments");
    await queryInterface.dropTable("supervisor_notifications");
    await queryInterface.dropTable("supervisor_commission_shares");
    await queryInterface.dropTable("supervisor_assignments");
    await queryInterface.removeColumn("Deals", "owner_commission_share");
    await queryInterface.removeColumn("Deals", "supervisor_1_share");
    await queryInterface.removeColumn("Deals", "supervisor_2_share");
  },
};
