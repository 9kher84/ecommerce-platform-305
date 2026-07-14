module.exports = (sequelize, DataTypes) => {
  return sequelize.define(
    "InventoryTransaction",
    {
      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
      },
      productId: {
        type: DataTypes.UUID,
        allowNull: false,
      },
      organizationId: {
        type: DataTypes.UUID,
        allowNull: false,
      },
      direction: {
        type: DataTypes.ENUM("IN", "OUT", "NONE"), // NONE for reservation/allocation where physical balance doesn't leave the warehouse but changes state
        allowNull: false,
      },
      reason: {
        type: DataTypes.ENUM("RESERVE", "ALLOCATE", "SHIP", "RECEIVE", "RETURN", "QUARANTINE", "ADJUSTMENT"),
        allowNull: false,
      },
      quantity: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },
      balanceBefore: {
        type: DataTypes.JSONB, // Stores the state of all balances before this transaction e.g. { available: 100, reserved: 0, allocated: 0, inTransit: 0, quarantine: 0 }
        allowNull: false,
      },
      balanceAfter: {
        type: DataTypes.JSONB, // Stores the state of all balances after this transaction
        allowNull: false,
      },
      referenceType: {
        type: DataTypes.STRING, // e.g. 'PurchaseOrder', 'Shipment', 'Receipt'
        allowNull: false,
      },
      referenceId: {
        type: DataTypes.UUID,
        allowNull: false,
      },
      metadata: {
        type: DataTypes.JSONB,
        allowNull: true,
      }
    },
    {
      indexes: [
        { fields: ["productId"] },
        { fields: ["organizationId"] },
        { fields: ["referenceId"] },
      ],
    }
  );
};
