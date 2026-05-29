"use strict";

module.exports = {
  up: async (queryInterface, Sequelize) => {
    // 1. event_logs
    await queryInterface.createTable("event_logs", {
      id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true,
      },
      event_id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.literal("gen_random_uuid()"),
        unique: true,
        allowNull: false,
      },
      actor_id: {
        type: Sequelize.UUID,
        references: {
          model: "users",
          key: "id",
        },
        onDelete: "SET NULL",
      },
      actor_role: {
        type: Sequelize.STRING(50),
        allowNull: false,
      },
      entity_type: {
        type: Sequelize.STRING(50),
        allowNull: false,
      },
      entity_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
      },
      action_type: {
        type: Sequelize.STRING(50),
        allowNull: false,
      },
      before_state: {
        type: Sequelize.JSONB,
      },
      after_state: {
        type: Sequelize.JSONB,
      },
      ip_address: {
        type: Sequelize.INET,
      },
      user_agent: {
        type: Sequelize.TEXT,
      },
      timestamp: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal("NOW()"),
      },
      hash_signature: {
        type: Sequelize.STRING(255),
        allowNull: false,
      },
    });

    await queryInterface.addIndex("event_logs", ["entity_type", "entity_id"], {
      name: "idx_event_logs_entity",
    });
    await queryInterface.addIndex("event_logs", ["timestamp"], {
      name: "idx_event_logs_timestamp",
    });

    // 2. trust_scores
    await queryInterface.createTable("trust_scores", {
      user_id: {
        type: Sequelize.UUID,
        primaryKey: true,
        references: {
          model: "users",
          key: "id",
        },
        onDelete: "CASCADE",
      },
      reliability_index: {
        type: Sequelize.DECIMAL(5, 2),
        defaultValue: 0.0,
      },
      completion_rate: {
        type: Sequelize.DECIMAL(5, 2),
        defaultValue: 0.0,
      },
      cancellation_rate: {
        type: Sequelize.DECIMAL(5, 2),
        defaultValue: 0.0,
      },
      response_time_avg: {
        type: Sequelize.INTEGER,
        defaultValue: 0,
      },
      last_updated: {
        type: Sequelize.DATE,
        defaultValue: Sequelize.literal("NOW()"),
      },
    });

    // 3. sanctions
    await queryInterface.createTable("sanctions", {
      id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true,
      },
      user_id: {
        type: Sequelize.UUID,
        references: {
          model: "users",
          key: "id",
        },
        onDelete: "CASCADE",
      },
      sanction_type: {
        type: Sequelize.STRING(50),
        allowNull: false,
      },
      reason: {
        type: Sequelize.TEXT,
      },
      start_date: {
        type: Sequelize.DATE,
        allowNull: false,
      },
      end_date: {
        type: Sequelize.DATE,
      },
      active: {
        type: Sequelize.BOOLEAN,
        defaultValue: true,
      },
      created_by: {
        type: Sequelize.UUID,
        references: {
          model: "users",
          key: "id",
        },
      },
      created_at: {
        type: Sequelize.DATE,
        defaultValue: Sequelize.literal("NOW()"),
      },
    });

    // 4. admin_action_logs
    await queryInterface.createTable("admin_action_logs", {
      id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true,
      },
      admin_id: {
        type: Sequelize.UUID,
        references: {
          model: "users",
          key: "id",
        },
        onDelete: "SET NULL",
      },
      action_type: {
        type: Sequelize.STRING(100),
        allowNull: false,
      },
      target_type: {
        type: Sequelize.STRING(50),
      },
      target_id: {
        type: Sequelize.INTEGER,
      },
      details: {
        type: Sequelize.JSONB,
      },
      ip_address: {
        type: Sequelize.INET,
      },
      timestamp: {
        type: Sequelize.DATE,
        defaultValue: Sequelize.literal("NOW()"),
      },
    });
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.dropTable("admin_action_logs");
    await queryInterface.dropTable("sanctions");
    await queryInterface.dropTable("trust_scores");
    await queryInterface.dropTable("event_logs");
  },
};
