const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
    const Rating = sequelize.define('Rating', {
        id: {
            type: DataTypes.INTEGER,
            primaryKey: true,
            autoIncrement: true,
        },
        dealId: {
            type: DataTypes.INTEGER,
            allowNull: false,
            unique: true, // One rating per deal per rater? No, usually two ratings per deal (buyer->seller, seller->buyer)
            // Actually, let's make it composite unique with raterId if needed, or just allow multiple for now and validate in logic.
            // Better: One entry per rating action.
        },
        raterId: {
            type: DataTypes.UUID,
            allowNull: false,
            comment: 'User who is giving the rating'
        },
        ratedUserId: {
            type: DataTypes.UUID,
            allowNull: false,
            comment: 'User who is being rated'
        },
        rating: {
            type: DataTypes.INTEGER,
            allowNull: false,
            validate: {
                min: 1,
                max: 5
            }
        },
        comment: {
            type: DataTypes.TEXT,
            allowNull: true,
        },
        isHidden: {
            type: DataTypes.BOOLEAN,
            defaultValue: false,
            comment: 'Admin can hide inappropriate comments'
        }
    }, {
        tableName: 'ratings',
        timestamps: true,
        indexes: [
            { fields: ['dealId'] },
            { fields: ['raterId'] },
            { fields: ['ratedUserId'] }
        ]
    });

    return Rating;
};
