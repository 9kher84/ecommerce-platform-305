// backend/models/Deal.js
module.exports = (sequelize, DataTypes) => {
  const Deal = sequelize.define(
    "Deal",
    {
      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
      },
      purchaseRequestId: {
        type: DataTypes.UUID,
        allowNull: false,
      },
      priceQuoteId: {
        type: DataTypes.UUID,
        allowNull: false,
        unique: true,
      },
      sellerId: {
        type: DataTypes.UUID,
        allowNull: false,
      },
      buyerId: {
        type: DataTypes.UUID,
        allowNull: false,
      },
      finalAmount: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: true,
      },
      agreedDeliveryDate: {
        type: DataTypes.DATE,
        allowNull: true,
      },
      status: {
        type: DataTypes.ENUM(
          "processing",
          "paid",
          "delivered",
          "cancelled",
          "completed",
          "dispute",
          "resolved",
        ),
        defaultValue: "processing",
      },
      notes: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
      deliveryProof: {
        type: DataTypes.JSONB,
        allowNull: true,
      },
      invoiceData: {
        type: DataTypes.JSONB,
        allowNull: true,
        comment:
          "Snapshot of buyer/seller info at deal time (Electronic Invoice)",
      },
      invoiceText: {
        type: DataTypes.TEXT,
        allowNull: true,
        get() {
          try {
            const { decrypt } = require("../utils/encryption");
            const val = this.getDataValue("invoiceText");
            return val ? decrypt(val) : null;
          } catch (e) {
            return null;
          }
        },
        set(value) {
          if (value) {
            const { encrypt } = require("../utils/encryption");
            this.setDataValue("invoiceText", encrypt(value));
          }
        },
      },
      organization_id: {
        type: DataTypes.UUID,
        allowNull: true,
      },
    },
    {
      tableName: "deals",
      paranoid: true,
      timestamps: true,
      hooks: {
        beforeUpdate: (deal, options) => {
          if (deal.deal_locked && deal.changed()) {
            const allowedChanges = ["status", "deliveryProof"];
            const changedFields = deal.changed();
            for (const field of changedFields) {
              if (
                !allowedChanges.includes(field) &&
                field !== "deal_locked" &&
                field !== "invoice_id" &&
                field !== "updatedAt"
              ) {
                throw new Error("Deal is locked, cannot modify");
              }
            }
          }
        },
      },
      indexes: [
        { fields: ["purchaseRequestId"] },
        { fields: ["sellerId"] },
        { fields: ["buyerId"] },
        { fields: ["status"] },
      ],
    },
  );

  return Deal;
};
