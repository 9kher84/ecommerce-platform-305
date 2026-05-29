module.exports = (sequelize, DataTypes) => {
  return sequelize.define(
    "InventoryMetrics",
    {
      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
      },
      inventoryId: {
        type: DataTypes.UUID,
        allowNull: false,
        references: {
          model: "SmartInventories",
          key: "id",
        },
      },
      encryptedDemandHistory: {
        type: DataTypes.TEXT, // Encrypted JSON
        allowNull: true,
        get() {
          const val = this.getDataValue("encryptedDemandHistory");
          if (!val) return [];
          const { decrypt } = require("../utils/encryption");
          try {
            return JSON.parse(decrypt(val));
          } catch (e) {
            return [];
          }
        },
        set(value) {
          const { encrypt } = require("../utils/encryption");
          this.setDataValue(
            "encryptedDemandHistory",
            encrypt(JSON.stringify(value)),
          );
        },
      },
      encryptedReorderPoint: {
        type: DataTypes.TEXT, // Encrypted Number
        allowNull: true,
        get() {
          const val = this.getDataValue("encryptedReorderPoint");
          if (!val) return null;
          const { decrypt } = require("../utils/encryption");
          return parseInt(decrypt(val));
        },
        set(value) {
          const { encrypt } = require("../utils/encryption");
          this.setDataValue("encryptedReorderPoint", encrypt(String(value)));
        },
      },
    },
    {
      tableName: "inventory_metrics",
      timestamps: true,
    },
  );
};
