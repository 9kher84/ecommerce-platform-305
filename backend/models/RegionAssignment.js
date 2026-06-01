const { DataTypes } = require("sequelize");

module.exports = (sequelize) => {
  const RegionAssignment = sequelize.define(
    "RegionAssignment",
    {
      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
      },
      supervisor_id: {
        type: DataTypes.UUID,
        allowNull: false,
        references: {
          model: "Users",
          key: "id",
        },
      },
      region_name: {
        type: DataTypes.STRING(100),
        allowNull: false,
      },
      assigned_by: {
        type: DataTypes.UUID,
        references: {
          model: "Users",
          key: "id",
        },
      },
      is_active: {
        type: DataTypes.BOOLEAN,
        defaultValue: true,
      },
    },
    {
      tableName: "region_assignments",
      timestamps: true,
      createdAt: "created_at",
      updatedAt: "updated_at",
    },
  );

  return RegionAssignment;
};
