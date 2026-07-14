module.exports = (sequelize, DataTypes) => {
  const PurchaseRequestItem = sequelize.define(
    "PurchaseRequestItem",
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
      lineNumber: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },
      productDNAId: {
        type: DataTypes.UUID,
        allowNull: true,
      },
      categoryId: {
        type: DataTypes.INTEGER,
        allowNull: true,
      },
      freeTextDescription: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
      attributes: {
        type: DataTypes.JSONB,
        defaultValue: {},
      },
      quantity: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: false,
      },
      unit: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      status: {
        type: DataTypes.ENUM("pending", "quoted", "awarded", "cancelled", "closed"),
        defaultValue: "pending",
      },
    },
    {
      paranoid: true,
      timestamps: true,
    }
  );

  return PurchaseRequestItem;
};
