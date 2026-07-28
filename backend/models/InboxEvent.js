const { Model, DataTypes } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class InboxEvent extends Model {}

  InboxEvent.init({
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
  eventId: {
    type: DataTypes.UUID,
    allowNull: false,
  },
  consumerName: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  correlationId: {
    type: DataTypes.UUID,
    allowNull: true,
  },
  processedAt: {
    type: DataTypes.DATE,
    allowNull: false,
    defaultValue: DataTypes.NOW
  }
}, {
  sequelize,
  modelName: 'InboxEvent',
  tableName: 'InboxEvents',
  timestamps: false,
  indexes: [
    {
      unique: true,
      fields: ['eventId', 'consumerName'],
      name: 'idx_inbox_event_consumer_unique'
    }
  ]
});

  return InboxEvent;
};
