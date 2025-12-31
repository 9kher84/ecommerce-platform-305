module.exports = (sequelize, DataTypes) => {
    const PurchaseRequest = sequelize.define('PurchaseRequest', {
        id: {
            type: DataTypes.UUID,
            defaultValue: DataTypes.UUIDV4,
            primaryKey: true
        },
        title: {
            type: DataTypes.STRING,
            allowNull: false
        },
        deviceFingerprint: {
            type: DataTypes.STRING,
            allowNull: true
        },
        description: {
            type: DataTypes.TEXT,
            allowNull: true
        },
        quantity: {
            type: DataTypes.DECIMAL(10, 2),
            allowNull: true
        },
        unit: {
            type: DataTypes.STRING,
            allowNull: true
        },
        status: {
            // F3 State Machine States
            type: DataTypes.ENUM(
                'draft', 'published',
                'under_review', 'quoting', 'awaiting_decision',
                'accepted', 'completed', 'cancelled', 'suspended', 'expired'
            ),
            defaultValue: 'draft'
        },
        post_type: {
            type: DataTypes.ENUM('quick', 'standard', 'direct', 'reorder', 'scheduled'),
            defaultValue: 'standard'
        },
        auction_type: {
            type: DataTypes.ENUM('public', 'secret'),
            defaultValue: 'public'
        },
        delivery_city: {
            type: DataTypes.STRING,
            allowNull: true
        },
        pdfAttachments: {
            type: DataTypes.JSONB,
            defaultValue: []
        },
        fixed_price: {
            type: DataTypes.DECIMAL(10, 2),
            allowNull: true
        },
        targetSellerId: {
            type: DataTypes.UUID,
            allowNull: true
        },
        viewCount: {
            type: DataTypes.INTEGER,
            defaultValue: 0
        },
        quoteCount: {
            type: DataTypes.INTEGER,
            defaultValue: 0
        },
        expiresAt: {
            type: DataTypes.DATE,
            allowNull: true
        },
        modificationRequested: {
            type: DataTypes.BOOLEAN,
            defaultValue: false
        },
        modificationReason: {
            type: DataTypes.TEXT,
            allowNull: true
        },
        lastModifiedAt: {
            type: DataTypes.DATE,
            allowNull: true
        },
        // Old compatible fields (based on usage in RequestService createRequest)
        deliveryLocations: {
            type: DataTypes.JSONB,
            defaultValue: []
        },
        deliveryDates: {
            type: DataTypes.JSONB,
            allowNull: true
        },
        requiresDelivery: {
            type: DataTypes.BOOLEAN,
            defaultValue: true
        },
        requiresInstallation: {
            type: DataTypes.BOOLEAN,
            defaultValue: false
        },
        contactNumbers: {
            type: DataTypes.JSONB,
            defaultValue: []
        },
        images: {
            type: DataTypes.JSONB,
            defaultValue: []
        },
        hideOffers: {
            type: DataTypes.BOOLEAN,
            defaultValue: false
        },
        hidePersonalInfo: {
            type: DataTypes.BOOLEAN,
            defaultValue: false
        },
        directPurchase: {
            type: DataTypes.BOOLEAN,
            defaultValue: false
        },
        delivery_date: {
            type: DataTypes.DATE, // requestService maps to this
            allowNull: true
        },
        contact_number: {
            type: DataTypes.STRING,
            allowNull: true
        },
        attachments: {
            type: DataTypes.JSONB,
            defaultValue: []
        },
        price_range_min: { type: DataTypes.DECIMAL(10, 2) },
        price_range_max: { type: DataTypes.DECIMAL(10, 2) },
        advanced_options: { type: DataTypes.JSONB, defaultValue: {} },
        is_active: { type: DataTypes.BOOLEAN, defaultValue: true }
    }, {
        paranoid: true,
        timestamps: true
    });

    PurchaseRequest.prototype.canReceiveQuotes = function () {
        return this.status === 'published' && (!this.expiresAt || new Date(this.expiresAt) > new Date());
    };

    PurchaseRequest.prototype.canBeModified = function () {
        return this.status === 'draft' || this.quoteCount === 0;
    };

    return PurchaseRequest;
};
