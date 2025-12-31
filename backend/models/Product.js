module.exports = (sequelize, DataTypes) => {
    return sequelize.define('Product', {
        id: {
            type: DataTypes.UUID,
            defaultValue: DataTypes.UUIDV4,
            primaryKey: true
        },
        name: {
            type: DataTypes.JSON, // Changed to JSON for I18n { ar: String, en: String }
            allowNull: false
        },
        description: {
            type: DataTypes.JSON, // Added for I18n { ar: String, en: String }
            allowNull: true
        },
        productTier: {
            type: DataTypes.ENUM('basic', 'smart', 'ai_assisted'),
            defaultValue: 'basic'
        },
        specs: {
            type: DataTypes.TEXT,
            allowNull: true
        },
        origin: {
            type: DataTypes.STRING,
            allowNull: true
        },
        productionDate: {
            type: DataTypes.DATE,
            allowNull: true
        },
        estimatedPrice: {
            type: DataTypes.DECIMAL(10, 2),
            allowNull: true
        },
        purchasePrice: {
            type: DataTypes.STRING, // Encrypted string
            allowNull: true
        },
        deliveryTime: {
            type: DataTypes.INTEGER,
            allowNull: true
        },
        stockLevel: {
            type: DataTypes.INTEGER,
            defaultValue: 0
        },
        unit: {
            type: DataTypes.STRING,
            allowNull: false
        },
        image: {
            type: DataTypes.STRING,
            allowNull: true
        },
        lowStockThreshold: {
            type: DataTypes.INTEGER,
            defaultValue: 10
        },
        // AI Negotiation Fields (Tier A/B only)
        autoNegotiationEnabled: {
            type: DataTypes.BOOLEAN,
            defaultValue: false
        },
        minAcceptablePrice: {
            type: DataTypes.DECIMAL(10, 2),
            allowNull: true
        },
        negotiationStrategy: {
            type: DataTypes.JSON,
            allowNull: true
        }
    });
};
