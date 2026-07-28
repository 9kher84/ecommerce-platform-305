'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    // 1. Create OutboxEvents Table
    await queryInterface.createTable('OutboxEvents', {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        primaryKey: true,
      },
      eventId: {
        type: Sequelize.UUID,
        allowNull: false,
        unique: true,
      },
      aggregateType: {
        type: Sequelize.STRING,
        allowNull: false,
      },
      aggregateId: {
        type: Sequelize.UUID,
        allowNull: false,
      },
      aggregateVersion: {
        type: Sequelize.INTEGER,
        allowNull: true,
      },
      eventType: {
        type: Sequelize.STRING,
        allowNull: false,
      },
      schemaVersion: {
        type: Sequelize.INTEGER,
        allowNull: false,
        defaultValue: 1,
      },
      payload: {
        type: Sequelize.JSONB,
        allowNull: false,
      },
      correlationId: {
        type: Sequelize.UUID,
        allowNull: false,
      },
      causationId: {
        type: Sequelize.UUID,
        allowNull: true,
      },
      status: {
        type: Sequelize.ENUM('PENDING', 'PROCESSING', 'PUBLISHED', 'FAILED', 'DEAD_LETTER'),
        allowNull: false,
        defaultValue: 'PENDING',
      },
      occurredAt: {
        type: Sequelize.DATE,
        allowNull: false,
      },
      publishedAt: {
        type: Sequelize.DATE,
        allowNull: true,
      },
      errorReason: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
      lastErrorAt: {
        type: Sequelize.DATE,
        allowNull: true,
      },
      retryCount: {
        type: Sequelize.INTEGER,
        allowNull: false,
        defaultValue: 0,
      },
      nextRetryAt: {
        type: Sequelize.DATE,
        allowNull: true,
      },
      processingNode: {
        type: Sequelize.STRING,
        allowNull: true,
      },
      publishedBy: {
        type: Sequelize.STRING,
        allowNull: true,
      },
      savedAt: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.fn('now'),
      },
      updatedAt: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.fn('now'),
      }
    });

    // 2. Indexes for OutboxEvents
    // Partial index for fast claiming of pending events
    await queryInterface.addIndex('OutboxEvents', ['status', 'occurredAt'], {
      name: 'outbox_pending_events_idx',
      where: {
        status: 'PENDING'
      }
    });

    await queryInterface.addIndex('OutboxEvents', ['aggregateId', 'aggregateVersion'], {
      name: 'outbox_aggregate_idx'
    });

    // 3. Create InboxEvents Table
    await queryInterface.createTable('InboxEvents', {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        primaryKey: true,
      },
      eventId: {
        type: Sequelize.UUID,
        allowNull: false,
      },
      consumerName: {
        type: Sequelize.STRING,
        allowNull: false,
      },
      correlationId: {
        type: Sequelize.UUID,
        allowNull: false,
      },
      processedAt: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.fn('now'),
      },
      createdAt: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.fn('now'),
      },
      updatedAt: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.fn('now'),
      }
    });

    // 4. Unique Constraint for InboxEvents (eventId + consumerName)
    await queryInterface.addConstraint('InboxEvents', {
      fields: ['eventId', 'consumerName'],
      type: 'unique',
      name: 'inbox_event_consumer_unique'
    });
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.dropTable('InboxEvents');
    await queryInterface.dropTable('OutboxEvents');
    await queryInterface.sequelize.query('DROP TYPE IF EXISTS "enum_OutboxEvents_status";');
  }
};
