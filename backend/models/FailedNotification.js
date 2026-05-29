const { DataTypes } = require("sequelize");

module.exports = (sequelize) => {
  const FailedNotification = sequelize.define(
    "FailedNotification",
    {
      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
      },
      target_phone: {
        type: DataTypes.STRING(20),
        allowNull: false,
      },
      message: {
        type: DataTypes.TEXT,
        allowNull: false,
      },
      retry_count: {
        type: DataTypes.INTEGER,
        defaultValue: 0,
      },
      status: {
        type: DataTypes.STRING(20),
        defaultValue: "pending", // pending, success, failed_permanently
      },
      error_log: {
        type: DataTypes.TEXT,
      },
    },
    {
      tableName: "failed_notifications",
      timestamps: true,
      createdAt: "created_at",
      updatedAt: "updated_at",
    },
  );

  return FailedNotification;
};
