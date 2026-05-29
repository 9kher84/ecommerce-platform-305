const { DataTypes } = require("sequelize");

module.exports = (sequelize) => {
  const SupervisorAssignment = sequelize.define(
    "SupervisorAssignment",
    {
      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
      },
      deal_id: {
        type: DataTypes.UUID,
        allowNull: false,
        references: {
          model: "Deals",
          key: "id",
        },
      },
      supervisor_id: {
        type: DataTypes.UUID,
        allowNull: false,
        references: {
          model: "users",
          key: "id",
        },
      },
      assigned_by: {
        type: DataTypes.UUID,
        allowNull: false,
        references: {
          model: "users",
          key: "id",
        },
      },
      platform_share: {
        type: DataTypes.DECIMAL(5, 2),
        allowNull: false,
        defaultValue: 2.0,
      },
      supervisor_share: {
        type: DataTypes.DECIMAL(5, 2),
        allowNull: false,
        defaultValue: 0.5,
      },
    },
    {
      tableName: "supervisor_assignments",
      timestamps: true,
      createdAt: "created_at",
      updatedAt: "updated_at",
    },
  );

  return SupervisorAssignment;
};
