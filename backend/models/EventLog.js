// backend/models/EventLog.js
module.exports = (sequelize, DataTypes) => {
  const EventLog = sequelize.define(
    "EventLog",
    {
      eventId: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
        allowNull: false,
      },
      actorId: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      actorRole: {
        type: DataTypes.STRING(50),
        allowNull: false,
      },
      entityType: {
        type: DataTypes.STRING(50),
        allowNull: false,
      },
      entityId: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      actionType: {
        type: DataTypes.STRING(50),
        allowNull: false,
      },
      beforeState: {
        type: DataTypes.JSONB,
      },
      afterState: {
        type: DataTypes.JSONB,
      },
      ipAddress: {
        type: DataTypes.INET,
      },
      userAgent: {
        type: DataTypes.TEXT,
      },
      timestamp: {
        type: DataTypes.DATE,
        defaultValue: DataTypes.NOW,
        allowNull: false,
      },
      hashSignature: {
        type: DataTypes.STRING(255),
        allowNull: false,
      },
    },
    {
      tableName: "event_logs",
      timestamps: false,
      underscored: true,
    },
  );

  EventLog.associate = (models) => {
    if (models.User) {
      EventLog.belongsTo(models.User, { foreignKey: "actorId", as: "actor" });
    }
  };

  return EventLog;
};
