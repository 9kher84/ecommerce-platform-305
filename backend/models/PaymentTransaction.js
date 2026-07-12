const { DataTypes } = require("sequelize");

module.exports = (sequelize) => {
  const PaymentTransaction = sequelize.define(
    "PaymentTransaction",
    {
      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
      },
      // Transaction Details
      transactionId: {
        type: DataTypes.STRING,
        allowNull: false,
        comment: "Unique transaction ID from payment gateway",
      },
      dealId: {
        type: DataTypes.UUID,
        allowNull: false,
        references: {
          model: "deals",
          key: "id",
        },
      },
      userId: {
        type: DataTypes.UUID,
        allowNull: false,
        references: {
          model: "users",
          key: "id",
        },
        comment: "User who initiated the payment",
      },
      // Amount Information
      amount: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: false,
        validate: {
          min: 0.01,
        },
      },
      currency: {
        type: DataTypes.STRING(3),
        allowNull: false,
        defaultValue: "SAR",
      },
      // Payment Method (NO PAN STORAGE - PCI DSS Requirement)
      paymentMethodId: {
        type: DataTypes.UUID,
        allowNull: true,
        references: {
          model: "payment_methods",
          key: "id",
        },
        comment: "Reference to tokenized payment method",
      },
      paymentGateway: {
        type: DataTypes.ENUM("mada", "stc_pay", "apple_pay", "test"),
        allowNull: false,
      },
      // Transaction Status
      status: {
        type: DataTypes.ENUM(
          "pending", // Payment initiated
          "processing", // Being processed by gateway
          "completed", // Successfully completed
          "failed", // Payment failed
          "cancelled", // Cancelled by user
          "refunded", // Refunded
        ),
        defaultValue: "pending",
        allowNull: false,
      },
      // Gateway Response (Encrypted)
      gatewayResponse: {
        type: DataTypes.TEXT,
        allowNull: true,
        comment: "Encrypted gateway response for audit",
      },
      // Error Information
      errorCode: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      errorMessage: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
      // Timestamps
      initiatedAt: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: DataTypes.NOW,
      },
      completedAt: {
        type: DataTypes.DATE,
        allowNull: true,
      },
      // Metadata
      metadata: {
        type: DataTypes.JSON,
        allowNull: true,
        comment: "Additional transaction metadata",
      },
      // IP Address for fraud detection
      ipAddress: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      userAgent: {
        type: DataTypes.STRING,
        allowNull: true,
      },
    },
    {
      tableName: "payment_transactions",
      timestamps: true,
      indexes: [
        { fields: ["transactionId"], unique: true },
        { fields: ["dealId"] },
        { fields: ["userId"] },
        { fields: ["status"] },
        { fields: ["paymentGateway"] },
        { fields: ["createdAt"] },
        { fields: ["status", "createdAt"] }, // Composite index for queries
      ],
      hooks: {
        // Prevent updates to completed transactions (immutability)
        beforeUpdate: async (transaction, options) => {
          if (
            transaction.changed("status") &&
            transaction._previousDataValues.status === "completed"
          ) {
            throw new Error("Cannot modify completed payment transaction");
          }
        },
      },
    },
  );

  return PaymentTransaction;
};
