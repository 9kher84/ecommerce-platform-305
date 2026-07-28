const { DataTypes } = require("sequelize");

module.exports = (sequelize) => {
  return sequelize.define(
    "TemporaryGrant",
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
      grantedByActorId: {
        type: DataTypes.UUID,
        allowNull: true,
      },
      expiresAt: {
        type: DataTypes.DATE,
        allowNull: false,
      },
      status: {
        type: DataTypes.STRING,
        defaultValue: "ACTIVE", // 'ACTIVE' | 'EXPIRED' | 'REVOKED'
      },
    },
    {
      tableName: "TemporaryGrants",
      timestamps: true,
      indexes: [
        { fields: ["membershipId"] },
        { fields: ["permissionId"] },
        { fields: ["expiresAt"] }
      ]
    }
  );
};
