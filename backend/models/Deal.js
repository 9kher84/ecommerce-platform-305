module.exports = (sequelize, DataTypes) => {
    return sequelize.define('Deal', {
        id: {
            type: DataTypes.UUID,
            defaultValue: DataTypes.UUIDV4,
            primaryKey: true
        },
        finalAmount: {
            type: DataTypes.DECIMAL(10, 2),
            allowNull: true
        },
        agreedDeliveryDate: {
            type: DataTypes.DATE,
            allowNull: true
        },
        status: {
            type: DataTypes.ENUM('processing', 'paid', 'delivered', 'cancelled', 'completed', 'dispute', 'resolved'),
            defaultValue: 'processing'
        },
        notes: {
            type: DataTypes.TEXT,
            allowNull: true
        },
        deliveryProof: {
            type: DataTypes.JSONB,
            allowNull: true
        },
        invoiceData: {
            type: DataTypes.JSONB,
            allowNull: true,
            comment: 'Snapshot of buyer/seller info at deal time (Electronic Invoice)'
        }
    }, {
        paranoid: true,
        timestamps: true
    });
};
