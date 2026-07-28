const { DataTypes } = require("sequelize");

module.exports = (sequelize) => {
  return sequelize.define(
    "Delegation",
    {
      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
      },
      fromMembershipId: {
        type: DataTypes.UUID,
        allowNull: false,
        references: { model: "OrganizationMemberships", key: "id" },
      },
      toMembershipId: {
        type: DataTypes.UUID,
        allowNull: false,
        references: { model: "OrganizationMemberships", key: "id" },
      },
      validFrom: {
        type: DataTypes.DATE,
        allowNull: false,
      },
      validUntil: {
        type: DataTypes.DATE,
        allowNull: false,
      },
      scope: {
        type: DataTypes.JSONB,
        defaultValue: {},
      },
      status: {
        type: DataTypes.STRING,
        defaultValue: "ACTIVE", // 'ACTIVE' | 'EXPIRED' | 'REVOKED'
      },
    },
    {
      tableName: "Delegations",
      timestamps: true,
      indexes: [
        { fields: ["fromMembershipId"] },
        { fields: ["toMembershipId"] },
        { fields: ["status"] }
      ]
    }
  );
};
