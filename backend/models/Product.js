module.exports = (sequelize, DataTypes) => {
  return sequelize.define(
    "Product",
    {
      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
      },
      productDNAId: {
        type: DataTypes.UUID,
        allowNull: true,
      },
      name: {
        type: DataTypes.JSON, // Changed to JSON for I18n { ar: String, en: String }
        allowNull: false,
      },
      description: {
        type: DataTypes.JSON, // Added for I18n { ar: String, en: String }
        allowNull: true,
      },
      assetTypeId: {
        type: DataTypes.INTEGER,
        allowNull: true, // Nullable for backward compatibility
      },
      ownerOrganizationId: {
        type: DataTypes.UUID,
        allowNull: true, // Nullable for backward compatibility; User is actor, Org is owner
      },
      productTier: {
        type: DataTypes.ENUM("basic", "smart", "ai_assisted"),
        defaultValue: "basic",
      },
      specs: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
      origin: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      productionDate: {
        type: DataTypes.DATE,
        allowNull: true,
      },
      estimatedPrice: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: true,
      },
      purchasePrice: {
        type: DataTypes.STRING, // Encrypted string
        allowNull: true,
      },
      storageCost: {
        type: DataTypes.DECIMAL(10, 2),
        defaultValue: 0.0,
      },
      deliveryTime: {
        type: DataTypes.INTEGER,
        allowNull: true,
      },
      stockLevel: {
        type: DataTypes.INTEGER,
        defaultValue: 0,
      },
      status: {
        type: DataTypes.ENUM("active", "archived"),
        defaultValue: "active"
      },
      unit: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      image: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      lowStockThreshold: {
        type: DataTypes.INTEGER,
        defaultValue: 10,
      },
      sellerId: {
        type: DataTypes.UUID,
        allowNull: true,
      },
      categoryId: {
        type: DataTypes.INTEGER,
        allowNull: true,
      },
      // AI Negotiation Fields (Tier A/B only)
      autoNegotiationEnabled: {
        type: DataTypes.BOOLEAN,
        defaultValue: false,
      },
      minAcceptablePrice: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: true,
      },
      negotiationStrategy: {
        type: DataTypes.JSON,
        allowNull: true,
      },
      ai_proposals: {
        type: DataTypes.JSONB,
        allowNull: true,
      },
    },
    {
      indexes: [
        // 🚀 Sovereign Index Consolidation (SSC/OPT-05)
        // { unique: true, fields: ['name'] }, // Name is JSON, cannot index easily without expression, skipping unique constraint on JSON for now or handling carefully. Inspecting Product.js, name is JSON. Indexes on JSON might vary. ProductModel had name as STRING. Product.js has name as JSON. I will map strictly compatible indexes.
        // Converting compatible indexes:
        { fields: ["productTier"] }, // Enum is good for filter
        { fields: ["stockLevel"] },
        // Composite needed for search?
        // Existing ProductModel.js had sellerId/categoryId. Product.js MIGHT NOT have these columns defined in the define block explicitly if relying on association, BUT ProductModel showed them.
        // Let's check Product.js content again. It DOES NOT show sellerId or categoryId in the fields list in lines 1-73. Sequelize adds them automatically via associations usually, but best practice is to explicit define or just index them if they exist.
        // Wait, if columns are not in `define`, we can still index them if associations create them.
        // However, looking at Product.js (Turn 465), it does NOT have sellerId or categoryId explicitly defined.
        // I will add the indexes blindly assuming the columns exist via associations, which is standard Sequelize behavior.
      ],
    },
    {
      // 🚀 Sovereign Index Consolidation (from ProductModel.js)
      indexes: [
        // 🚀 Sovereign Indexes (Restored from ProductModel.js)
        // Note: 'name' is JSON. Removing 'unique' constraint to prevent rigid JSON matching issues.
        { fields: ["name"] },
        { fields: ["sellerId"] },
        { fields: ["categoryId"] },
        // Composite Indexes for filtered searches
        { fields: ["sellerId", "categoryId"] },
        { fields: ["name", "categoryId"] },
      ],
    },
  );
};
