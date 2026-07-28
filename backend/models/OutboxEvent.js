const { Model, DataTypes } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class OutboxEvent extends Model {}

  OutboxEvent.init({
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
  eventId: {
    type: DataTypes.UUID,
    allowNull: false,
    unique: true,
    comment: 'The UUID of the DomainEvent'
  },
  aggregateType: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  aggregateId: {
    type: DataTypes.UUID,
    allowNull: false,
  },
  aggregateVersion: {
    type: DataTypes.INTEGER,
    allowNull: true,
  },
  eventType: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  schemaVersion: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 1
  },
  payload: {
    type: DataTypes.JSONB,
    allowNull: false,
  },
  correlationId: {
    type: DataTypes.UUID,
    allowNull: false,
  },
  causationId: {
    type: DataTypes.UUID,
    allowNull: true,
  },
  status: {
    type: DataTypes.ENUM('PENDING', 'PROCESSING', 'PUBLISHED', 'FAILED', 'DEAD_LETTER'),
    allowNull: false,
    defaultValue: 'PENDING',
  },
  occurredAt: {
    type: DataTypes.DATE,
    allowNull: false,
  },
  publishedAt: {
    type: DataTypes.DATE,
    allowNull: true,
  },
  errorReason: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
  lastErrorAt: {
    type: DataTypes.DATE,
    allowNull: true,
  },
  retryCount: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 0,
  },
  nextRetryAt: {
    type: DataTypes.DATE,
    allowNull: true,
  },
  processingNode: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  publishedBy: {
    type: DataTypes.STRING,
    allowNull: true,
  }
}, {
  sequelize,
  modelName: 'OutboxEvent',
  tableName: 'OutboxEvents',
  timestamps: true,
  updatedAt: 'updatedAt',
  createdAt: 'savedAt',
  indexes: [
    {
      fields: ['status', 'occurredAt']
    },
    {
      fields: ['aggregateId', 'aggregateVersion']
    }
  ]
});

  return OutboxEvent;
};
