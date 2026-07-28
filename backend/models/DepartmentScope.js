const { DataTypes } = require("sequelize");

module.exports = (sequelize) => {
  return sequelize.define(
    "DepartmentScope",
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
      departmentName: {
        type: DataTypes.STRING,
        allowNull: false,
      },
    },
    {
      tableName: "DepartmentScopes",
      timestamps: true,
      indexes: [
        { fields: ["membershipId"] },
        { fields: ["departmentName"] }
      ]
    }
  );
};
