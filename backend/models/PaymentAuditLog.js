const { DataTypes } = require("sequelize");

module.exports = (sequelize) => {
  const PaymentAuditLog = sequelize.define(
    "PaymentAuditLog",
    {
      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
      },
      // Transaction Reference
      paymentTransactionId: {
        type: DataTypes.UUID,
        allowNull: true,
        references: {
          model: "payment_transactions",
          key: "id",
        },
      },
      // User Information
      userId: {
        type: DataTypes.UUID,
        allowNull: true,
        references: {
          model: "users",
          key: "id",
        },
      },
      // Action Details
      action: {
        type: DataTypes.ENUM(
          "payment_initiated",
          "payment_processing",
          "payment_completed",
          "payment_failed",
          "payment_cancelled",
          "payment_refunded",
          "gateway_callback",
          "webhook_received",
          "token_created",
          "token_deleted",
          "fraud_detected",
          "security_alert",
        ),
        allowNull: false,
      },
      // Event Details (Encrypted for sensitive data)
      details: {
        type: DataTypes.TEXT,
        allowNull: true,
        comment: "Encrypted JSON with event details",
      },
      // Request Information
      ipAddress: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      userAgent: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      // Gateway Information
      gateway: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      gatewayTransactionId: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      // Status
      severity: {
        type: DataTypes.ENUM("info", "warning", "error", "critical"),
        defaultValue: "info",
        allowNull: false,
      },
      // Metadata
      metadata: {
        type: DataTypes.JSON,
        allowNull: true,
      },
    },
    {
      tableName: "payment_audit_logs",
      timestamps: true,
      updatedAt: false, // Immutable logs
      indexes: [
        { fields: ["paymentTransactionId"] },
        { fields: ["userId"] },
        { fields: ["action"] },
        { fields: ["severity"] },
        { fields: ["createdAt"] },
        { fields: ["action", "createdAt"] },
      ],
      hooks: {
        // Make logs immutable
        beforeUpdate: (record, options) => {
          throw new Error(
            "Payment audit logs are immutable and cannot be updated.",
          );
        },
        beforeDestroy: (record, options) => {
          throw new Error(
            "Payment audit logs are immutable and cannot be deleted.",
          );
        },
      },
    },
  );

  return PaymentAuditLog;
};
