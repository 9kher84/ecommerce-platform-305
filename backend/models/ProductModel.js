module.exports = (sequelize, DataTypes) => {
    const Product = sequelize.define('Product', {
        id: {
            type: DataTypes.INTEGER,
            primaryKey: true,
            autoIncrement: true
        },
        // 🛑 العمود المفقود الذي كان يسبب الخطأ
        name: {
            type: DataTypes.STRING,
            allowNull: false,
            unique: true // يجب أن يكون اسم المنتج فريداً
        },
        description: {
            type: DataTypes.TEXT,
            allowNull: true // يمكن أن يكون الوصف اختيارياً
        },
        // تعريف مفاتيح الأجنبية بشكل صريح لزيادة الوضوح والتحكم
        categoryId: {
            type: DataTypes.INTEGER,
            allowNull: false,
            references: { model: 'categories', key: 'id' }
        },
        sellerId: {
            type: DataTypes.UUID,
            allowNull: false,
            references: { model: 'users', key: 'id' }
        }
    }, {
        tableName: 'products',
        timestamps: true,
        // إضافة مؤشر لـ name لتحسين أداء البحث والتجميع
        indexes: [
            { unique: true, fields: ['name'] },
        ]
    });

    // 🛑 إضافة العلاقات هنا - لم تتغير
    Product.associate = (models) => {
        // كل منتج ينتمي لفئة واحدة
        Product.belongsTo(models.Category, { foreignKey: 'categoryId', as: 'category' });
        // كل منتج يمكن أن يكون مرتبطاً بالعديد من المنشورات
        Product.hasMany(models.Post, { foreignKey: 'productId', as: 'posts' }); 
        // كل منتج ينتمي لبائع واحد
        Product.belongsTo(models.User, { foreignKey: 'sellerId', as: 'seller' });
    };

    return Product;
};