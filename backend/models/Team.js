const { DataTypes } = require("sequelize");

module.exports = (sequelize) => {
  const Team = sequelize.define(
    "Team",
    {
      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
      },
      organizationId: {
        type: DataTypes.UUID,
        allowNull: false,
        references: {
          model: "organizations",
          key: "id",
        },
      },
      name: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      teamType: {
        type: DataTypes.STRING,
        defaultValue: "PROCUREMENT", // 'PROCUREMENT' | 'FINANCE' | 'PROJECT' | 'WAREHOUSE' | 'LEGAL' | 'EXECUTIVE'
      },
      description: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      status: {
        type: DataTypes.STRING,
        defaultValue: "ACTIVE", // 'ACTIVE' | 'ARCHIVED'
      },
    },
    {
      tableName: "teams",
      timestamps: true,
    },
  );

  return Team;
};
