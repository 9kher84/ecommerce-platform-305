// backend/models/Invoice.js
const crypto = require("crypto");

module.exports = (sequelize, DataTypes) => {
  const Invoice = sequelize.define(
    "Invoice",
    {
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
      },
      uuid: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        unique: true,
        allowNull: false,
      },
      dealId: {
        type: DataTypes.UUID,
        allowNull: false,
        field: "deal_id",
      },
      buyerId: {
        type: DataTypes.UUID,
        allowNull: false,
        field: "buyer_id",
      },
      sellerId: {
        type: DataTypes.UUID,
        allowNull: false,
        field: "seller_id",
      },
      invoiceNumber: {
        type: DataTypes.STRING(50),
        unique: true,
        allowNull: false,
        field: "invoice_number",
      },
      token: {
        type: DataTypes.STRING(255),
        unique: true,
        allowNull: false,
      },
      status: {
        type: DataTypes.STRING(30),
        allowNull: false,
        defaultValue: "pending",
      },
      issueDate: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: DataTypes.NOW,
        field: "issue_date",
      },
      dueDate: {
        type: DataTypes.DATE,
        allowNull: false,
        field: "due_date",
      },
      autoCancelDate: {
        type: DataTypes.DATE,
        field: "auto_cancel_date",
      },
      totalAmount: {
        type: DataTypes.DECIMAL(12, 2),
        allowNull: false,
        field: "total_amount",
      },
      taxAmount: {
        type: DataTypes.DECIMAL(12, 2),
        defaultValue: 0,
        field: "tax_amount",
      },
      discountAmount: {
        type: DataTypes.DECIMAL(12, 2),
        defaultValue: 0,
        field: "discount_amount",
      },
      paidAmount: {
        type: DataTypes.DECIMAL(12, 2),
        defaultValue: 0,
        field: "paid_amount",
      },
      currency: {
        type: DataTypes.STRING(3),
        defaultValue: "SAR",
      },
      items: {
        type: DataTypes.JSONB,
        allowNull: false,
      },
      buyerSnapshot: {
        type: DataTypes.JSONB,
        field: "buyer_snapshot",
      },
      sellerSnapshot: {
        type: DataTypes.JSONB,
        field: "seller_snapshot",
      },
      deliveryProof: {
        type: DataTypes.JSONB,
        field: "delivery_proof",
      },
      paymentProof: {
        type: DataTypes.JSONB,
        field: "payment_proof",
      },
      notes: {
        type: DataTypes.TEXT,
      },
      createdAt: {
        type: DataTypes.DATE,
        defaultValue: DataTypes.NOW,
        field: "created_at",
      },
      updatedAt: {
        type: DataTypes.DATE,
        defaultValue: DataTypes.NOW,
        field: "updated_at",
      },
    },
    {
      tableName: "invoices",
      timestamps: false, // We handle it manually via hooks or fields
      hooks: {
        beforeValidate: async (invoice, options) => {
          if (!invoice.invoiceNumber) {
            const year = new Date().getFullYear();
            // Temporary pseudo-random number, usually we'd use a sequence
            const rand = Math.floor(1000 + Math.random() * 9000);
            invoice.invoiceNumber = `INV-${year}-${rand}-${Date.now().toString().slice(-4)}`;
          }
          if (!invoice.token) {
            invoice.token = crypto.randomBytes(32).toString("hex");
          }
        },
        beforeUpdate: (invoice, options) => {
          invoice.updatedAt = new Date();
        },
      },
    },
  );

  Invoice.associate = (models) => {
    Invoice.belongsTo(models.Deal, { foreignKey: "dealId", as: "deal" });
    Invoice.belongsTo(models.User, { foreignKey: "buyerId", as: "buyer" });
    Invoice.belongsTo(models.User, { foreignKey: "sellerId", as: "seller" });
    Invoice.hasMany(models.CommissionTransaction, {
      foreignKey: "invoiceId",
      as: "commissions",
    });
  };

  return Invoice;
};
