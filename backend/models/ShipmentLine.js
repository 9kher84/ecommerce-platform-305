module.exports = (sequelize, DataTypes) => {
  const ShipmentLine = sequelize.define(
    "ShipmentLine",
    {
      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
      },
      shipmentId: {
        type: DataTypes.UUID,
        allowNull: false,
      },
      purchaseOrderLineId: {
        type: DataTypes.UUID,
        allowNull: false,
      },
      quantityPacked: {
        type: DataTypes.DECIMAL(10, 2),
        defaultValue: 0,
        comment: "Quantity physically packed in warehouse",
      },
      quantityLoaded: {
        type: DataTypes.DECIMAL(10, 2),
        defaultValue: 0,
        comment: "Quantity loaded onto carrier",
      },
      quantityShipped: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: false,
        defaultValue: 0,
        comment: "Quantity officially dispatched",
      },
    },
    {
      paranoid: true,
      timestamps: true,
      indexes: [
        { fields: ["shipmentId"] },
        { fields: ["purchaseOrderLineId"] },
      ],
    }
  );

  return ShipmentLine;
};
