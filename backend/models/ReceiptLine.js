module.exports = (sequelize, DataTypes) => {
  const ReceiptLine = sequelize.define(
    "ReceiptLine",
    {
      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
      },
      receiptId: {
        type: DataTypes.UUID,
        allowNull: false,
      },
      purchaseOrderLineId: {
        type: DataTypes.UUID,
        allowNull: false,
      },
      acceptedQuantity: {
        type: DataTypes.DECIMAL(10, 2),
        defaultValue: 0,
      },
      rejectedQuantity: {
        type: DataTypes.DECIMAL(10, 2),
        defaultValue: 0,
      },
      damagedQuantity: {
        type: DataTypes.DECIMAL(10, 2),
        defaultValue: 0,
      },
      rejectionReason: {
        type: DataTypes.STRING,
        allowNull: true,
      },
    },
    {
      paranoid: true,
      timestamps: true,
      indexes: [
        { fields: ["receiptId"] },
        { fields: ["purchaseOrderLineId"] },
      ],
    }
  );

  return ReceiptLine;
};
