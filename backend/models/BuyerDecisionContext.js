"use strict";
const { Model } = require("sequelize");

module.exports = (sequelize, DataTypes) => {
  class BuyerDecisionContext extends Model {
    static associate(models) {
      BuyerDecisionContext.belongsTo(models.User, {
        foreignKey: "buyerId",
        as: "buyer",
      });
      BuyerDecisionContext.belongsTo(models.PriceQuote, {
        foreignKey: "quoteId",
        as: "quote",
      });
      BuyerDecisionContext.belongsTo(models.PurchaseRequest, {
        foreignKey: "requestId",
        as: "request",
      });
    }
  }

  BuyerDecisionContext.init(
    {
      id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
      buyerId: { type: DataTypes.UUID, allowNull: false },
      quoteId: { type: DataTypes.UUID, allowNull: false },
      requestId: { type: DataTypes.UUID, allowNull: false },
      decision_reason: {
        type: DataTypes.ENUM(
          "PRICE",
          "DELIVERY_TIME",
          "TRUST",
          "PREVIOUS_DEAL",
          "RECOMMENDATION",
          "OTHER",
        ),
        allowNull: false,
      },
      notes: { type: DataTypes.TEXT },
      confidence_level: {
        type: DataTypes.INTEGER,
        validate: { min: 1, max: 10 },
      },
      createdAt: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: DataTypes.NOW,
      },
      updatedAt: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: DataTypes.NOW,
      },
    },
    {
      sequelize,
      modelName: "BuyerDecisionContext",
      tableName: "BuyerDecisionContexts",
    },
  );

  return BuyerDecisionContext;
};
