module.exports = (sequelize, DataTypes) => {
  const ActionLog = sequelize.define(
    "ActionLog",
    {
      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
      },
      adminId: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      targetId: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      fieldName: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      oldValue: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
      newValue: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
      ipAddress: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      timestamp: {
        type: DataTypes.DATE,
        defaultValue: DataTypes.NOW,
      },
    },
    {
      tableName: "ActionLogs",
      timestamps: false,
      hooks: {
        beforeUpdate: () => {
          throw new Error(
            "❌ SOVEREIGN POLICY VIOLATION: ActionLogs are immutable and cannot be updated.",
          );
        },
        beforeDestroy: () => {
          throw new Error(
            "❌ SOVEREIGN POLICY VIOLATION: ActionLogs are immutable and cannot be deleted.",
          );
        },
      },
    },
  );

  return ActionLog;
};
