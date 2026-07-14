module.exports = (sequelize, DataTypes) => {
  const Receipt = sequelize.define(
    "Receipt",
    {
      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
      },
      purchaseOrderId: {
        type: DataTypes.UUID,
        allowNull: false,
      },
      shipmentId: {
        type: DataTypes.UUID,
        allowNull: true,
        comment: "Nullable to support blind receipts without formal seller shipment tracking",
      },
      buyerId: {
        type: DataTypes.UUID,
        allowNull: false,
      },
      status: {
        type: DataTypes.ENUM("pending_inspection", "accepted", "rejected", "partial"),
        defaultValue: "pending_inspection",
      },
      receivedAt: {
        type: DataTypes.DATE,
        allowNull: true,
      },
    },
    {
      paranoid: true,
      timestamps: true,
      indexes: [
        { fields: ["purchaseOrderId"] },
        { fields: ["shipmentId"] },
        { fields: ["buyerId"] },
        { fields: ["status"] },
      ],
    }
  );

  return Receipt;
};
