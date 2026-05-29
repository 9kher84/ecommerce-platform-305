const { DataTypes } = require("sequelize");

module.exports = (sequelize) => {
  const SupervisorCommissionShare = sequelize.define(
    "SupervisorCommissionShare",
    {
      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
      },
      assignment_id: {
        type: DataTypes.UUID,
        allowNull: false,
        references: {
          model: "supervisor_assignments",
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
      deal_id: {
        type: DataTypes.UUID,
        allowNull: false,
        references: {
          model: "Deals",
          key: "id",
        },
      },
      amount: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: false,
      },
      status: {
        type: DataTypes.STRING(20),
        defaultValue: "pending",
      },
      paid_at: {
        type: DataTypes.DATE,
      },
    },
    {
      tableName: "supervisor_commission_shares",
      timestamps: true,
      createdAt: "created_at",
      updatedAt: "updated_at",
    },
  );

  return SupervisorCommissionShare;
};
