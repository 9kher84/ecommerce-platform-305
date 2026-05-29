// backend/models/BuyerLimit.js
module.exports = (sequelize, DataTypes) => {
  const BuyerLimit = sequelize.define(
    "BuyerLimit",
    {
      buyerId: {
        type: DataTypes.UUID,
        primaryKey: true,
        references: {
          model: "Users",
          key: "id",
        },
      },
      currentLimit: {
        type: DataTypes.INTEGER,
        defaultValue: 3,
      },
      totalCompletedDeals: {
        type: DataTypes.INTEGER,
        defaultValue: 0,
      },
    },
    {
      tableName: "buyer_limits",
      timestamps: true,
      underscored: true,
    },
  );

  BuyerLimit.associate = (models) => {
    BuyerLimit.belongsTo(models.User, { foreignKey: "buyerId", as: "buyer" });
  };

  return BuyerLimit;
};
