const { DataTypes } = require("sequelize");

module.exports = (sequelize) => {
  return sequelize.define(
    "PermissionGroupPermission",
    {
      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
      },
      permissionGroupId: {
        type: DataTypes.UUID,
        allowNull: false,
        references: { model: "permission_groups", key: "id" },
      },
      permissionId: {
        type: DataTypes.UUID,
        allowNull: false,
        references: { model: "permissions", key: "id" },
      },
    },
    {
      tableName: "permission_group_permissions",
      timestamps: true,
    }
  );
};
