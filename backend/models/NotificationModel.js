const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
    const Notification = sequelize.define('Notification', {
        id: {
            type: DataTypes.INTEGER,
            primaryKey: true,
            autoIncrement: true,
        },
        recipientId: {
            type: DataTypes.UUID,
            allowNull: false,
            references: { model: 'users', key: 'id' },
            comment: 'معرف المستخدم الذي سيستلم الإشعار'
        },
        message: {
            type: DataTypes.STRING(500),
            allowNull: false,
            comment: 'نص الإشعار'
        },
        entityType: {
            type: DataTypes.ENUM('post', 'offer', 'deal', 'system', 'rating'),
            allowNull: false,
            comment: 'نوع الكيان المرتبط (لتسهيل التوجيه في الواجهة الأمامية)'
        },
        entityId: {
            type: DataTypes.INTEGER,
            allowNull: true,
            comment: 'معرف الكيان المرتبط (PostId, OfferId, DealId)'
        },
        isRead: {
            type: DataTypes.BOOLEAN,
            allowNull: false,
            defaultValue: false
        },
    }, {
        tableName: 'notifications',
        timestamps: true,
        // فهرس حاسم لتحسين الأداء عند جلب الإشعارات غير المقروءة لمستخدم ما
        indexes: [
            { fields: ['recipientId', 'isRead'] },
            { fields: ['entityType', 'entityId'] }
        ]
    });

    // يجب إضافة هذا السطر في ملف sequelize_setup.js لتعريف العلاقة
    // Notification.belongsTo(User, { as: 'recipient', foreignKey: 'recipientId' });

    return Notification;
};