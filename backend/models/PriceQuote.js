module.exports = (sequelize, DataTypes) => {
  const PriceQuote = sequelize.define("PriceQuote", {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    amount: {
      type: DataTypes.TEXT,
      allowNull: true,
      get() {
        const { decrypt } = require("../utils/encryption");
        return decrypt(this.getDataValue("amount"));
      },
      set(value) {
        const { encrypt } = require("../utils/encryption");
        this.setDataValue("amount", encrypt(String(value)));
      },
    },
    priceType: {
      type: DataTypes.ENUM("fixed", "flexible"),
      defaultValue: "fixed",
    },
    fixedPrice: {
      type: DataTypes.TEXT,
      allowNull: true,
      get() {
        const { decrypt } = require("../utils/encryption");
        return decrypt(this.getDataValue("fixedPrice"));
      },
      set(value) {
        const { encrypt } = require("../utils/encryption");
        this.setDataValue("fixedPrice", encrypt(String(value)));
      },
    },
    priceRangeMin: {
      type: DataTypes.TEXT,
      allowNull: true,
      get() {
        const { decrypt } = require("../utils/encryption");
        return decrypt(this.getDataValue("priceRangeMin"));
      },
      set(value) {
        const { encrypt } = require("../utils/encryption");
        this.setDataValue("priceRangeMin", encrypt(String(value)));
      },
    },
    priceRangeMax: {
      type: DataTypes.TEXT,
      allowNull: true,
      get() {
        const { decrypt } = require("../utils/encryption");
        return decrypt(this.getDataValue("priceRangeMax"));
      },
      set(value) {
        const { encrypt } = require("../utils/encryption");
        this.setDataValue("priceRangeMax", encrypt(String(value)));
      },
    },
    flexibilityReason: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    currency: {
      type: DataTypes.STRING,
      defaultValue: "SAR",
    },
    canDeliver: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
    },
    canInstall: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
    },
    deliveryCost: {
      type: DataTypes.DECIMAL(10, 2),
      defaultValue: 0,
    },
    proposedDates: {
      type: DataTypes.JSONB,
      defaultValue: [],
    },
    technicalDetails: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    invoiceImage: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    notes: {
      type: DataTypes.TEXT,
      allowNull: true,
      get() {
        const { decrypt } = require("../utils/encryption");
        return decrypt(this.getDataValue("notes"));
      },
      set(value) {
        const { encrypt } = require("../utils/encryption");
        this.setDataValue("notes", encrypt(value));
      },
    },
    status: {
      type: DataTypes.ENUM(
        "pending",
        "accepted",
        "rejected",
        "countered",
        "withdrawn",
        "negotiating",
        "under_negotiation",
      ),
      defaultValue: "pending",
    },
    lockedBy: {
      type: DataTypes.UUID,
      allowNull: true,
    },
    lockExpiresAt: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    deliveryDate: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    warrantyMonths: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
    },
    is_alternate_seller: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
    },
    buyerCounterOffer: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: true,
    },
    buyerCounterDate: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    negotiationHistory: {
      type: DataTypes.JSONB,
      defaultValue: [],
    },
    modifiedAfterRejection: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
    },
    originalQuoteId: {
      type: DataTypes.UUID,
      allowNull: true,
    },
    withdrawnAt: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    withdrawalReason: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    acceptedAt: {
      type: DataTypes.DATE,
      allowNull: true,
      defaultValue: null,
    },
    // RFQ & Decision Board Extensions (EXEC-LOCK-002-REV1)
    deliveryTime: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    rfqType: {
      type: DataTypes.ENUM("standard", "legacy"),
      defaultValue: "standard",
    },
    decisionStatus: {
      type: DataTypes.ENUM(
        "pending",
        "accepted",
        "rejected",
        "countered",
        "backup",
      ),
      defaultValue: "pending",
    },
    counterPrice: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: true,
    },
    buyerNotes: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    decisionAt: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    organization_id: {
      type: DataTypes.UUID,
      allowNull: true,
    },
  });

  PriceQuote.prototype.canBeWithdrawn = function () {
    return ["pending", "negotiating"].includes(this.status);
  };

  PriceQuote.prototype.canBeModified = function () {
    return this.status === "rejected" && !this.modifiedAfterRejection;
  };

  PriceQuote.prototype.getFinalPrice = function () {
    if (this.priceType === "fixed") {
      return this.fixedPrice || this.amount;
    }
    return this.buyerCounterOffer || this.priceRangeMin;
  };

  return PriceQuote;
};
