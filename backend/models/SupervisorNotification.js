const { DataTypes } = require("sequelize");

module.exports = (sequelize) => {
  const SupervisorNotification = sequelize.define(
    "SupervisorNotification",
    {
      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
      },
      supervisor_id: {
        type: DataTypes.UUID,
        allowNull: false,
        references: {
          model: "Users",
          key: "id",
        },
      },
      type: {
        type: DataTypes.STRING(50),
        allowNull: false,
      },
      title: {
        type: DataTypes.STRING(255),
        allowNull: false,
      },
      message: {
        type: DataTypes.TEXT,
        allowNull: false,
      },
      priority: {
        type: DataTypes.STRING(20),
        defaultValue: "normal",
      },
      deal_id: {
        type: DataTypes.UUID,
        references: {
          model: "Deals",
          key: "id",
        },
      },
      read: {
        type: DataTypes.BOOLEAN,
        defaultValue: false,
      },
      metadata: {
        type: DataTypes.JSONB,
      },
    },
    {
      tableName: "supervisor_notifications",
      timestamps: true,
      createdAt: "created_at",
      updatedAt: "updated_at",
    },
  );

  return SupervisorNotification;
};
