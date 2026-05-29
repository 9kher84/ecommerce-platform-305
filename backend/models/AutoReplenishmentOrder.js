module.exports = (sequelize, DataTypes) => {
  return sequelize.define(
    "AutoReplenishmentOrder",
    {
      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
      },
      inventoryId: {
        type: DataTypes.UUID,
        allowNull: false,
      },
      productId: {
        type: DataTypes.UUID,
        allowNull: false,
      },
      status: {
        type: DataTypes.ENUM(
          "evaluating",
          "negotiating",
          "ordered",
          "fulfilled",
          "failed",
          "sys_lock",
        ),
        defaultValue: "evaluating",
      },
      encryptedTargetPrice: {
        type: DataTypes.TEXT, // Encrypted ceiling
        allowNull: false,
        get() {
          const val = this.getDataValue("encryptedTargetPrice");
          if (!val) return null;
          const { decrypt } = require("../utils/encryption");
          return parseFloat(decrypt(val));
        },
        set(value) {
          const { encrypt } = require("../utils/encryption");
          this.setDataValue("encryptedTargetPrice", encrypt(String(value)));
        },
      },
      encryptedNegotiationLog: {
        type: DataTypes.TEXT,
        allowNull: true,
        get() {
          const val = this.getDataValue("encryptedNegotiationLog");
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
            "encryptedNegotiationLog",
            encrypt(JSON.stringify(value)),
          );
        },
      },
      lockReason: {
        type: DataTypes.STRING,
        allowNull: true,
      },
    },
    {
      tableName: "auto_replenishment_orders",
      timestamps: true,
    },
  );
};
