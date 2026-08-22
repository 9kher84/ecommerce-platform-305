module.exports = (sequelize, DataTypes) => {
  const PurchaseRequest = sequelize.define(
    "PurchaseRequest",
    {
      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
      },
      title: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      version: {
        type: DataTypes.INTEGER,
        defaultValue: 1,
      },
      deviceFingerprint: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      description: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
      quantity: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: true,
      },
      unit: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      status: {
        // F3 State Machine States
        type: DataTypes.ENUM(
          "draft",
          "published",
          "rfq_published",
          "under_review",
          "quoting",
          "awaiting_decision",
          "accepted",
          "partially_awarded",
          "deal_in_progress",
          "completed",
          "cancelled",
          "suspended",
          "expired",
          "negotiating",
        ),
        defaultValue: "draft",
      },
      post_type: {
        type: DataTypes.ENUM(
          "quick",
          "standard",
          "direct",
          "reorder",
          "scheduled",
        ),
        defaultValue: "standard",
      },
      auction_type: {
        type: DataTypes.ENUM("public", "secret"),
        defaultValue: "public",
      },
      tender_type: {
        type: DataTypes.ENUM("PUBLIC", "PRIVATE", "INVITATION"),
        allowNull: true,
      },
      pricing_method: {
        type: DataTypes.ENUM("OPEN", "FIXED_BUDGET"),
        allowNull: true,
      },
      delivery_city: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      pdfAttachments: {
        type: DataTypes.JSONB,
        defaultValue: [],
      },
      fixed_price: {
        type: DataTypes.TEXT,
        allowNull: true,
        get() {
          const { decrypt } = require("../utils/encryption");
          const raw = this.getDataValue("fixed_price");
          if (!raw) return null;
          const decrypted = decrypt(raw);
          return (decrypted === "null" || decrypted === "undefined" || decrypted === "") ? null : decrypted;
        },
        set(value) {
          const { encrypt } = require("../utils/encryption");
          if (value === null || value === undefined || value === "" || value === "null" || value === "undefined") {
            this.setDataValue("fixed_price", null);
          } else {
            this.setDataValue("fixed_price", encrypt(String(value)));
          }
        },
      },
      targetSellerId: {
        type: DataTypes.UUID,
        allowNull: true,
      },
      sectorId: {
        type: DataTypes.INTEGER,
        allowNull: true, // Legacy field
        references: {
          model: "Categories",
          key: "id",
        },
      },
      viewCount: {
        type: DataTypes.INTEGER,
        defaultValue: 0,
      },
      quoteCount: {
        type: DataTypes.INTEGER,
        defaultValue: 0,
      },
      expiresAt: {
        type: DataTypes.DATE,
        allowNull: true,
      },
      modificationRequested: {
        type: DataTypes.BOOLEAN,
        defaultValue: false,
      },
      modificationReason: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
      lastModifiedAt: {
        type: DataTypes.DATE,
        allowNull: true,
      },
      // Old compatible fields (based on usage in RequestService createRequest)
      deliveryLocations: {
        type: DataTypes.JSONB,
        defaultValue: [],
      },
      deliveryDates: {
        type: DataTypes.JSONB,
        allowNull: true,
      },
      requiresDelivery: {
        type: DataTypes.BOOLEAN,
        defaultValue: true,
      },
      requiresInstallation: {
        type: DataTypes.BOOLEAN,
        defaultValue: false,
      },
      contactNumbers: {
        type: DataTypes.JSONB,
        defaultValue: [],
      },
      images: {
        type: DataTypes.JSONB,
        defaultValue: [],
      },
      hideOffers: {
        type: DataTypes.BOOLEAN,
        defaultValue: false,
      },
      hidePersonalInfo: {
        type: DataTypes.BOOLEAN,
        defaultValue: false,
      },
      directPurchase: {
        type: DataTypes.BOOLEAN,
        defaultValue: false,
      },
      delivery_date: {
        type: DataTypes.DATE, // requestService maps to this
        allowNull: true,
      },
      contact_number: {
        type: DataTypes.TEXT,
        allowNull: true,
        get() {
          const { decrypt } = require("../utils/encryption");
          return decrypt(this.getDataValue("contact_number"));
        },
        set(value) {
          const { encrypt } = require("../utils/encryption");
          this.setDataValue("contact_number", encrypt(value));
        },
      },
      attachments: {
        type: DataTypes.JSONB,
        defaultValue: [],
      },
      price_range_min: { type: DataTypes.DECIMAL(10, 2) },
      price_range_max: { type: DataTypes.DECIMAL(10, 2) },
      advanced_options: { type: DataTypes.JSONB, defaultValue: {} },
      is_active: { type: DataTypes.BOOLEAN, defaultValue: true },
      rfqStatus: {
        type: DataTypes.ENUM("draft", "rfq_published", "quoting", "closed"),
        defaultValue: "draft",
      },
      organization_id: {
        type: DataTypes.UUID,
        allowNull: true,
      },
      assetTypeId: {
        type: DataTypes.INTEGER,
        allowNull: true, // For mapping Demand Intents properly
      },
      approval_status: {
        type: DataTypes.STRING,
        defaultValue: "none", // pending_approval, approved, rejected, none
      },
      approved_by: {
        type: DataTypes.UUID,
        allowNull: true,
      },
      approved_at: {
        type: DataTypes.DATE,
        allowNull: true,
      },
    },
    {
      paranoid: true,
      timestamps: true,
    },
  );

  PurchaseRequest.prototype.canReceiveQuotes = function () {
    const PUBLISHED_STATUSES = ["published", "rfq_published"];
    const conditionResult = (
      PUBLISHED_STATUSES.includes(this.status) &&
      (!this.expiresAt || new Date(this.expiresAt) > new Date())
    );

    console.log("QUOTE ACCEPTANCE RESULT", {
      requestId: this.id,
      status: this.status,
      result: conditionResult
    });

    return conditionResult;
  };

  PurchaseRequest.prototype.canBeModified = function () {
    return this.status === "draft" || this.quoteCount === 0;
  };

  return PurchaseRequest;
};
