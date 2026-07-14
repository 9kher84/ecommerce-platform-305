module.exports = (sequelize, DataTypes) => {
  const Quotation = sequelize.define(
    "Quotation",
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
      sellerOrganizationId: {
        type: DataTypes.UUID,
        allowNull: false,
      },
      invitationId: {
        type: DataTypes.UUID,
        allowNull: true,
      },
      status: {
        type: DataTypes.ENUM("draft", "submitted", "accepted", "rejected", "expired", "withdrawn", "superseded"),
        defaultValue: "draft",
      },
      subtotal: {
        type: DataTypes.DECIMAL(15, 2),
        allowNull: false,
        defaultValue: 0.0,
      },
      taxAmount: {
        type: DataTypes.DECIMAL(15, 2),
        allowNull: false,
        defaultValue: 0.0,
      },
      discountAmount: {
        type: DataTypes.DECIMAL(15, 2),
        allowNull: false,
        defaultValue: 0.0,
      },
      grandTotal: {
        type: DataTypes.DECIMAL(15, 2),
        allowNull: false,
        defaultValue: 0.0,
      },
      submittedAt: {
        type: DataTypes.DATE,
        allowNull: true,
      },
      expiresAt: {
        type: DataTypes.DATE,
        allowNull: true,
      },
      withdrawnAt: {
        type: DataTypes.DATE,
        allowNull: true,
      },
      acceptedAt: {
        type: DataTypes.DATE,
        allowNull: true,
      },
      rejectedAt: {
        type: DataTypes.DATE,
        allowNull: true,
      },
      paymentTerms: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
    },
    {
      paranoid: true,
      timestamps: true,
    }
  );

  return Quotation;
};
