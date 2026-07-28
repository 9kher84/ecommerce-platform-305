const { DataTypes } = require("sequelize");

module.exports = (sequelize) => {
  return sequelize.define(
    "Permission",
    {
      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
      },
      key: {
        type: DataTypes.STRING,
        allowNull: false,
        unique: true,
      },
      name: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      description: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      module: {
        type: DataTypes.STRING,
        defaultValue: "PROCUREMENT", // 'PROCUREMENT' | 'FINANCE' | 'GOVERNANCE' | 'SYSTEM'
      },
      riskLevel: {
        type: DataTypes.STRING,
        defaultValue: "LOW", // 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL'
      },
      isDelegatable: {
        type: DataTypes.BOOLEAN,
        defaultValue: true,
      },
      requiresSOD: {
        type: DataTypes.BOOLEAN,
        defaultValue: false,
      },
      requiresApproval: {
        type: DataTypes.BOOLEAN,
        defaultValue: false,
      },
    },
    {
      tableName: "permissions",
      timestamps: true,
    }
  );
};
