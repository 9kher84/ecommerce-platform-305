const { DataTypes } = require("sequelize");

module.exports = (sequelize) => {
  return sequelize.define(
    "ProjectScope",
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
      purchaseRequestId: {
        type: DataTypes.UUID,
        allowNull: false,
        references: { model: "PurchaseRequests", key: "id" },
      },
    },
    {
      tableName: "ProjectScopes",
      timestamps: true,
      indexes: [
        { fields: ["membershipId"] },
        { fields: ["purchaseRequestId"] },
        { unique: true, fields: ["membershipId", "purchaseRequestId"] }
      ]
    }
  );
};
