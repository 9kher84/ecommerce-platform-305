module.exports = (sequelize, DataTypes) => {
  const InvoiceLine = sequelize.define(
    "InvoiceLine",
    {
      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
      },
      invoiceId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        field: "invoice_id",
      },
      purchaseOrderLineId: {
        type: DataTypes.UUID,
        allowNull: false,
        field: "purchase_order_line_id",
      },
      receiptLineId: {
        type: DataTypes.UUID,
        allowNull: true,
        field: "receipt_line_id",
      },
      invoicedQuantity: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: false,
        defaultValue: 0,
        field: "invoiced_quantity",
      },
      unitPrice: {
        type: DataTypes.DECIMAL(12, 2),
        allowNull: false,
        defaultValue: 0,
        field: "unit_price",
      },
      totalAmount: {
        type: DataTypes.DECIMAL(12, 2),
        allowNull: false,
        defaultValue: 0,
        field: "total_amount",
      },
    },
    {
      tableName: "invoice_lines",
      paranoid: true,
      timestamps: true,
      underscored: true,
      indexes: [
        { fields: ["invoice_id"] },
        { fields: ["purchase_order_line_id"] },
        { fields: ["receipt_line_id"] },
      ],
    }
  );

  return InvoiceLine;
};
