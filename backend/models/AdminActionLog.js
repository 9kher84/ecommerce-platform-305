// backend/models/AdminActionLog.js
module.exports = (sequelize, DataTypes) => {
  const AdminActionLog = sequelize.define(
    "AdminActionLog",
    {
      adminId: {
        type: DataTypes.INTEGER,
        allowNull: true,
      },
      actionType: {
        type: DataTypes.STRING(100),
        allowNull: false,
      },
      targetType: {
        type: DataTypes.STRING(50),
      },
      targetId: {
        type: DataTypes.INTEGER,
      },
      details: {
        type: DataTypes.JSONB,
      },
      ipAddress: {
        type: DataTypes.INET,
      },
      timestamp: {
        type: DataTypes.DATE,
        defaultValue: DataTypes.NOW,
      },
    },
    {
      tableName: "admin_action_logs",
      timestamps: false,
      underscored: true,
    },
  );

  AdminActionLog.associate = (models) => {
    if (models.User) {
      AdminActionLog.belongsTo(models.User, {
        foreignKey: "adminId",
        as: "admin",
      });
    }
  };

  return AdminActionLog;
};
