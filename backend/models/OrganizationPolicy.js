const { DataTypes } = require("sequelize");

module.exports = (sequelize) => {
  return sequelize.define(
    "OrganizationPolicy",
    {
      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
      },
      organizationId: {
        type: DataTypes.UUID,
        allowNull: false,
        references: { model: "organizations", key: "id" },
      },
      policyKey: {
        type: DataTypes.STRING,
        allowNull: false, // e.g. 'AWARD_APPROVAL_THRESHOLD', 'DUAL_APPROVAL_REQUIRED'
      },
      value: {
        type: DataTypes.JSONB,
        allowNull: false,
      },
      description: {
        type: DataTypes.STRING,
        allowNull: true,
      },
    },
    {
      tableName: "OrganizationPolicies",
      timestamps: true,
    }
  );
};
