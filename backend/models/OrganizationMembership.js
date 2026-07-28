const { DataTypes } = require("sequelize");

module.exports = (sequelize) => {
  return sequelize.define(
    "OrganizationMembership",
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
      userId: {
        type: DataTypes.UUID,
        allowNull: false,
        references: { model: "Users", key: "id" },
      },
      role: {
        type: DataTypes.STRING,
        defaultValue: "EMPLOYEE",
      },
      title: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      defaultViewMode: {
        type: DataTypes.STRING,
        defaultValue: "PROFESSIONAL",
      },
      isOwner: {
        type: DataTypes.BOOLEAN,
        defaultValue: false,
      },
      status: {
        type: DataTypes.STRING,
        defaultValue: "ACTIVE",
      },
    },
    {
      tableName: "OrganizationMemberships",
      timestamps: true,
    }
  );
};
