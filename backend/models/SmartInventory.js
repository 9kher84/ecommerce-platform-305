module.exports = (sequelize, DataTypes) => {
  return sequelize.define("SmartInventory", {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    productId: {
      type: DataTypes.UUID,
      allowNull: false,
      // References Product handled in associations
    },
    sellerId: {
      type: DataTypes.UUID,
      allowNull: false,
      // References User handled in associations
    },
    storageCapacity: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
    expectedIncomingStock: {
      type: DataTypes.JSON, // Stores array of expected shipments
      allowNull: true,
    },
    storageDurationDays: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
    manufactureDate: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    warehousePressureScore: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: true,
    },
    warehouseContacts: {
      type: DataTypes.JSONB,
      defaultValue: [],
      /**
       * Structure:
       * {
       *   id: UUID,
       *   name: String (Encrypted),
       *   email: String (Encrypted),
       *   permissions: Array
       * }
       */
    },
    oneTimeAccessToken: {
      type: DataTypes.TEXT,
      allowNull: true,
      get() {
        const { decrypt } = require("../utils/encryption");
        return decrypt(this.getDataValue("oneTimeAccessToken"));
      },
      set(value) {
        const { encrypt } = require("../utils/encryption");
        this.setDataValue("oneTimeAccessToken", encrypt(value));
      },
    },
    tokenExpiresAt: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    specsBlindIndex: {
      type: DataTypes.STRING,
      allowNull: true,
      comment: "HMAC-SHA256 index of product specs for fast matching",
    },
    lowStockThreshold: {
      type: DataTypes.INTEGER,
      defaultValue: 10,
    },
    autoReplenishEnabled: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
    },
    // --- Epic 5: Inventory Integration (Ledger) ---
    availableQuantity: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
      comment: "Stock physically present and not allocated/reserved"
    },
    reservedQuantity: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
      comment: "Stock reserved because a PO was accepted"
    },
    allocatedQuantity: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
      comment: "Stock allocated to an active shipment (preparing)"
    },
    inTransitQuantity: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
      comment: "Stock currently shipped but not yet received"
    },
    quarantineQuantity: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
      comment: "Stock returned, rejected, or damaged needing inspection"
    },
  });
};
