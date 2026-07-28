const { DataTypes } = require("sequelize");

module.exports = (sequelize) => {
  return sequelize.define(
    "MembershipPermission",
    {
      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
      },
      membershipId: {
        type: DataTypes.UUID,
        allowNull: false,
        references: { model: "OrganizationMemberships", key: "id" },
      },
      permissionId: {
        type: DataTypes.UUID,
        allowNull: false,
        references: { model: "permissions", key: "id" },
      },
      effect: {
        type: DataTypes.STRING,
        allowNull: false,
        defaultValue: "ALLOW", // 'ALLOW' | 'DENY'
      },
    },
    {
      tableName: "MembershipPermissions",
      timestamps: true,
    }
  );
};
