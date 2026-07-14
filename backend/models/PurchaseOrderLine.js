module.exports = (sequelize, DataTypes) => {
  const PurchaseOrderLine = sequelize.define(
    "PurchaseOrderLine",
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
      awardLineId: {
        type: DataTypes.UUID,
        allowNull: false,
      },
      productDNAId: {
        type: DataTypes.UUID,
        allowNull: true,
      },
      quantity: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: false,
      },
      unitPrice: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: false,
      },
      snapshot: {
        type: DataTypes.JSONB,
        allowNull: false,
        comment: "Deep snapshot of the item details (description, unit, specs)",
      },
    },
    {
      paranoid: true,
      timestamps: true,
      indexes: [
        { fields: ["purchaseOrderId"] },
        { fields: ["awardLineId"] },
      ],
    }
  );

  return PurchaseOrderLine;
};
