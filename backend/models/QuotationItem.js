module.exports = (sequelize, DataTypes) => {
  const QuotationItem = sequelize.define(
    "QuotationItem",
    {
      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
      },
      quotationId: {
        type: DataTypes.UUID,
        allowNull: false,
      },
      purchaseRequestItemId: {
        type: DataTypes.UUID,
        allowNull: false,
      },
      productDNAId: {
        type: DataTypes.UUID,
        allowNull: true,
      },
      // --- Snapshot Fields (from PR Item at time of quote) ---
      requestedDescription: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
      requestedQuantity: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: true,
      },
      requestedUnit: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      // -------------------------------------------------------
      unitPrice: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: false,
      },
      quantityOffered: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: false,
      },
      currency: {
        type: DataTypes.STRING,
        defaultValue: "SAR",
      },
      taxRate: {
        type: DataTypes.DECIMAL(5, 2),
        defaultValue: 15.00,
      },
      discount: {
        type: DataTypes.DECIMAL(10, 2),
        defaultValue: 0.00,
      },
      leadTime: {
        type: DataTypes.INTEGER,
        allowNull: true,
      },
      notes: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
    },
    {
      paranoid: true,
      timestamps: true,
    }
  );

  return QuotationItem;
};
