"use strict";
const { Model } = require("sequelize");

module.exports = (sequelize, DataTypes) => {
  class SellerInteractionEvent extends Model {
    static associate(models) {
      SellerInteractionEvent.belongsTo(models.User, {
        foreignKey: "sellerId",
        as: "seller",
      });
      SellerInteractionEvent.belongsTo(models.PurchaseRequest, {
        foreignKey: "requestId",
        as: "request",
      });
    }
  }

  SellerInteractionEvent.init(
    {
      id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
      sellerId: { type: DataTypes.UUID, allowNull: false },
      requestId: { type: DataTypes.UUID, allowNull: false }, // Using UUID for consistency
      interactionType: {
        type: DataTypes.ENUM(
          "RECEIVED",
          "OPENED",
          "IGNORED",
          "QUOTED",
          "VIEWED",
        ),
        allowNull: false,
      },
      timestamp: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: DataTypes.NOW,
      },
      metadata: { type: DataTypes.JSONB, defaultValue: {} },
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
      modelName: "SellerInteractionEvent",
      tableName: "SellerInteractionEvents",
      indexes: [
        { fields: ["sellerId", "requestId"] },
        { fields: ["interactionType"] },
        { fields: ["timestamp"] },
      ],
    },
  );

  return SellerInteractionEvent;
};
