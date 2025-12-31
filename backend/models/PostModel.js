module.exports = (sequelize, DataTypes) => {
    const Post = sequelize.define('Post', {
        id: {
            type: DataTypes.INTEGER,
            primaryKey: true,
            autoIncrement: true,
        },
        title: {
            type: DataTypes.STRING,
            allowNull: false,
        },
        description: {
            type: DataTypes.TEXT,
            allowNull: false,
        },
        startingPrice: {
            type: DataTypes.VIRTUAL, // Placeholder for legacy support if needed
        },
        quantity: {
            type: DataTypes.DECIMAL(10, 2),
            allowNull: true, // Optional
            defaultValue: 1.00
        },
        unit: {
            type: DataTypes.STRING,
            allowNull: true, // Optional
            defaultValue: 'unit'
        },
        deliveryDate: {
            type: DataTypes.DATE,
            allowNull: true, // Optional
        },
        deliveryLocation: {
            type: DataTypes.STRING,
            allowNull: false,
            defaultValue: 'Riyadh'
        },
        complexDelivery: {
            type: DataTypes.JSON,
            allowNull: true,
        },
        isSmartPost: {
            type: DataTypes.BOOLEAN,
            defaultValue: false,
        },
        currentHighestOffer: {
            type: DataTypes.DECIMAL(10, 2),
            allowNull: true,
            field: 'currenthighestoffer'
        },
        highestOfferBuyerId: {
            type: DataTypes.UUID,
            allowNull: true,
            field: 'highestofferbuyerid'
        },
        expiryDate: {
            type: DataTypes.DATE,
            allowNull: false,
            field: 'expirydate'
        },
        images: {
            type: DataTypes.JSON,
            allowNull: true,
            defaultValue: [],
        },
        attachment: { // Added for PDF support
            type: DataTypes.STRING,
            allowNull: true,
        },
        status: {
            type: DataTypes.ENUM('active', 'sold', 'expired', 'canceled', 'reverse_auction', 'open', 'closed'),
            defaultValue: 'open',
            allowNull: false,
        },
        productId: {
            type: DataTypes.INTEGER,
            allowNull: true, // Optional
        },
        buyerId: {
            type: DataTypes.UUID,
            allowNull: false,
            field: 'buyerid',
        },
    }, {
        tableName: 'posts',
        timestamps: true,
    });

    Post.associate = (models) => {
        // 1. علاقة المشتري (Buyer/Creator)
        Post.belongsTo(models.User, { foreignKey: 'buyerid', as: 'buyer' });

        // 2. علاقة المنتج (Product)
        Post.belongsTo(models.Product, { foreignKey: 'productId', as: 'product' });

        // 3. علاقة العروض (Offers)
        Post.hasMany(models.Offer, { foreignKey: 'postId', as: 'offers' });
    };

    return Post;
};