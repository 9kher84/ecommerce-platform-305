const { DataTypes } = require("sequelize");

module.exports = (sequelize) => {
  const RolePermission = sequelize.define(
    "RolePermission",
    {
      roleId: {
        type: DataTypes.UUID,
        references: {
          model: "roles",
          key: "id",
        },
      },
      permissionId: {
        type: DataTypes.UUID,
        references: {
          model: "permissions",
          key: "id",
        },
      },
    },
    {
      tableName: "role_permissions",
      timestamps: false,
    },
  );

  return RolePermission;
};
