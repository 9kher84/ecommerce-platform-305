module.exports = (sequelize, DataTypes) => {
  const PurchaseOrder = sequelize.define(
    "PurchaseOrder",
    {
      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
      },
      purchaseOrderNumber: {
        type: DataTypes.STRING,
        allowNull: false,
        unique: true,
      },
      revision: {
        type: DataTypes.INTEGER,
        defaultValue: 1,
      },
      awardId: {
        type: DataTypes.UUID,
        allowNull: false,
      },
      buyerId: {
        type: DataTypes.UUID,
        allowNull: false,
      },
      sellerOrganizationId: {
        type: DataTypes.UUID,
        allowNull: false,
      },
      currency: {
        type: DataTypes.STRING,
        defaultValue: "SAR",
      },
      paymentTerms: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      deliveryTerms: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      businessStatus: {
        type: DataTypes.ENUM("draft", "issued", "accepted", "rejected", "counter_requested", "cancelled", "closed"),
        defaultValue: "draft",
      },
      fulfillmentStatus: {
        type: DataTypes.ENUM("pending", "preparing", "ready_to_ship", "partially_shipped", "shipped", "partially_received", "received", "returned"),
        defaultValue: "pending",
      },
      snapshot: {
        type: DataTypes.JSONB,
        allowNull: false,
        comment: "Deep snapshot including { rfq, quotation, award } to remain legally self-sufficient",
      },
      issuedAt: {
        type: DataTypes.DATE,
        allowNull: true,
      },
      issuedBy: {
        type: DataTypes.UUID,
        allowNull: true,
      },
      acceptedAt: {
        type: DataTypes.DATE,
        allowNull: true,
      },
      acceptedBy: {
        type: DataTypes.UUID,
        allowNull: true,
      },
    },
    {
      paranoid: true,
      timestamps: true,
      indexes: [
        { fields: ["purchaseOrderNumber"] },
        { fields: ["awardId"] },
        { fields: ["buyerId"] },
        { fields: ["sellerOrganizationId"] },
        { fields: ["businessStatus"] },
        { fields: ["fulfillmentStatus"] },
      ],
    }
  );

  return PurchaseOrder;
};
