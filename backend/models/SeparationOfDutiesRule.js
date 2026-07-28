const { DataTypes } = require("sequelize");

module.exports = (sequelize) => {
  return sequelize.define(
    "SeparationOfDutiesRule",
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
      ruleType: {
        type: DataTypes.STRING,
        allowNull: false, // e.g. 'CREATOR_NOT_APPROVER', 'REQUESTER_NOT_FINANCE'
      },
      incompatiblePermissions: {
        type: DataTypes.JSONB,
        allowNull: false, // array of incompatible permission keys
      },
      description: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      status: {
        type: DataTypes.STRING,
        defaultValue: "ACTIVE", // 'ACTIVE' | 'DISABLED'
      },
    },
    {
      tableName: "SeparationOfDutiesRules",
      timestamps: true,
      indexes: [
        { fields: ["organizationId"] },
        { fields: ["ruleType"] }
      ]
    }
  );
};
