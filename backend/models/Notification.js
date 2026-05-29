// backend/models/Notification.js
module.exports = (sequelize, DataTypes) => {
  const Notification = sequelize.define(
    "Notification",
    {
      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
      },
      recipientId: {
        type: DataTypes.UUID,
        allowNull: false,
        field: "userId", // Mapping to existing column if necessary, but recipientId is cleaner
      },
      message: {
        type: DataTypes.TEXT,
        allowNull: false,
      },
      entityType: {
        type: DataTypes.ENUM(
          "offer",
          "deal",
          "post",
          "rating",
          "system",
          "payment",
        ),
        allowNull: true,
      },
      entityId: {
        type: DataTypes.UUID,
        allowNull: true,
      },
      isRead: {
        type: DataTypes.BOOLEAN,
        defaultValue: false,
      },
    },
    {
      tableName: "notifications",
      timestamps: true,
      indexes: [{ fields: ["createdAt"] }],
    },
  );

  return Notification;
};
