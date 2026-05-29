"use strict";
const { Model } = require("sequelize");

module.exports = (sequelize, DataTypes) => {
  class MarketSilenceEvent extends Model {
    static associate(models) {
      MarketSilenceEvent.belongsTo(models.Category, {
        foreignKey: "sectorId",
        as: "sector",
      });
      MarketSilenceEvent.belongsTo(models.PurchaseRequest, {
        foreignKey: "requestId",
        as: "request",
      });
    }
  }

  MarketSilenceEvent.init(
    {
      id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
      sectorId: { type: DataTypes.INTEGER, allowNull: false },
      requestId: { type: DataTypes.UUID, allowNull: false }, // Using UUID for consistency with PurchaseRequest
      elapsedTime: {
        type: DataTypes.INTEGER,
        allowNull: false,
        comment: "الوقت المنقضي بالدقائق",
      },
      silenceThreshold: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 1440,
        comment: "حد الصمت بالدقائق (24 ساعة افتراضياً)",
      },
      status: {
        type: DataTypes.ENUM("active", "resolved", "expired"),
        defaultValue: "active",
      },
      resolvedAt: { type: DataTypes.DATE },
      notes: { type: DataTypes.TEXT },
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
      modelName: "MarketSilenceEvent",
      tableName: "MarketSilenceEvents",
      indexes: [
        { fields: ["sectorId"] },
        { fields: ["status"] },
        { fields: ["createdAt"] },
      ],
    },
  );

  return MarketSilenceEvent;
};
