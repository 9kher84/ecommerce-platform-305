const { DataTypes } = require("sequelize");

module.exports = (sequelize) => {
  return sequelize.define(
    "BranchScope",
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
      branchName: {
        type: DataTypes.STRING,
        allowNull: false,
      },
    },
    {
      tableName: "BranchScopes",
      timestamps: true,
      indexes: [
        { fields: ["membershipId"] },
        { fields: ["branchName"] }
      ]
    }
  );
};
