// backend/models/CommissionTransaction.js
module.exports = (sequelize, DataTypes) => {
  const CommissionTransaction = sequelize.define(
    "CommissionTransaction",
    {
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
      },
      dealId: {
        type: DataTypes.UUID,
        allowNull: false,
        references: {
          model: "deals",
          key: "id",
        },
      },
      sellerId: {
        type: DataTypes.UUID,
        allowNull: false,
        references: {
          model: "users",
          key: "id",
        },
      },
      buyerId: {
        type: DataTypes.UUID,
        allowNull: false,
        references: {
          model: "users",
          key: "id",
        },
      },
      amount: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: false,
      },
      status: {
        type: DataTypes.ENUM("pending", "paid"),
        defaultValue: "pending",
      },
    },
    {
      tableName: "commission_transactions",
      timestamps: true,
      underscored: true,
    },
  );

  CommissionTransaction.associate = (models) => {
    CommissionTransaction.belongsTo(models.Deal, {
      foreignKey: "dealId",
      as: "deal",
    });
    CommissionTransaction.belongsTo(models.User, {
      foreignKey: "sellerId",
      as: "seller",
    });
    CommissionTransaction.belongsTo(models.User, {
      foreignKey: "buyerId",
      as: "buyer",
    });
  };

  return CommissionTransaction;
};
