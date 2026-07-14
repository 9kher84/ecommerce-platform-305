module.exports = (sequelize, DataTypes) => {
  const Shipment = sequelize.define(
    "Shipment",
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
      sellerOrganizationId: {
        type: DataTypes.UUID,
        allowNull: false,
      },
      trackingNumber: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      carrier: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      status: {
        type: DataTypes.ENUM("preparing", "ready_to_ship", "in_transit", "delivered", "exception"),
        defaultValue: "preparing",
      },
      shippedAt: {
        type: DataTypes.DATE,
        allowNull: true,
      },
      estimatedDeliveryAt: {
        type: DataTypes.DATE,
        allowNull: true,
      },
    },
    {
      paranoid: true,
      timestamps: true,
      indexes: [
        { fields: ["purchaseOrderId"] },
        { fields: ["sellerOrganizationId"] },
        { fields: ["status"] },
      ],
    }
  );

  return Shipment;
};
