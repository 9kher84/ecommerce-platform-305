module.exports = (sequelize, DataTypes) => {
    const PriceQuote = sequelize.define('PriceQuote', {
        id: {
            type: DataTypes.UUID,
            defaultValue: DataTypes.UUIDV4,
            primaryKey: true
        },
        amount: {
            type: DataTypes.DECIMAL(10, 2),
            allowNull: true
        },
        priceType: {
            type: DataTypes.ENUM('fixed', 'flexible'),
            defaultValue: 'fixed'
        },
        fixedPrice: {
            type: DataTypes.DECIMAL(10, 2),
            allowNull: true
        },
        priceRangeMin: {
            type: DataTypes.DECIMAL(10, 2),
            allowNull: true
        },
        priceRangeMax: {
            type: DataTypes.DECIMAL(10, 2),
            allowNull: true
        },
        flexibilityReason: {
            type: DataTypes.TEXT,
            allowNull: true
        },
        currency: {
            type: DataTypes.STRING,
            defaultValue: 'SAR'
        },
        canDeliver: {
            type: DataTypes.BOOLEAN,
            defaultValue: false
        },
        canInstall: {
            type: DataTypes.BOOLEAN,
            defaultValue: false
        },
        deliveryCost: {
            type: DataTypes.DECIMAL(10, 2),
            defaultValue: 0
        },
        proposedDates: {
            type: DataTypes.JSONB,
            defaultValue: []
        },
        technicalDetails: {
            type: DataTypes.TEXT,
            allowNull: true
        },
        invoiceImage: {
            type: DataTypes.STRING,
            allowNull: true
        },
        notes: {
            type: DataTypes.TEXT,
            allowNull: true
        },
        status: {
            type: DataTypes.ENUM('pending', 'accepted', 'rejected', 'countered', 'withdrawn', 'negotiating'),
            defaultValue: 'pending'
        },
        deliveryDate: {
            type: DataTypes.DATE,
            allowNull: true
        },
        warrantyMonths: {
            type: DataTypes.INTEGER,
            defaultValue: 0
        },
        is_alternate_seller: {
            type: DataTypes.BOOLEAN,
            defaultValue: false
        },
        buyerCounterOffer: {
            type: DataTypes.DECIMAL(10, 2),
            allowNull: true
        },
        buyerCounterDate: {
            type: DataTypes.DATE,
            allowNull: true
        },
        negotiationHistory: {
            type: DataTypes.JSONB,
            defaultValue: []
        },
        modifiedAfterRejection: {
            type: DataTypes.BOOLEAN,
            defaultValue: false
        },
        originalQuoteId: {
            type: DataTypes.UUID,
            allowNull: true
        },
        withdrawnAt: {
            type: DataTypes.DATE,
            allowNull: true
        },
        withdrawalReason: {
            type: DataTypes.TEXT,
            allowNull: true
        },
        acceptedAt: {
            type: DataTypes.DATE,
            allowNull: true,
            defaultValue: null
        }
    });

    PriceQuote.prototype.canBeWithdrawn = function () {
        return ['pending', 'negotiating'].includes(this.status);
    };

    PriceQuote.prototype.canBeModified = function () {
        return this.status === 'rejected' && !this.modifiedAfterRejection;
    };

    PriceQuote.prototype.getFinalPrice = function () {
        if (this.priceType === 'fixed') {
            return this.fixedPrice || this.amount;
        }
        return this.buyerCounterOffer || this.priceRangeMin;
    };

    return PriceQuote;
};
