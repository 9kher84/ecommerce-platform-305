const { Sequelize, DataTypes } = require('sequelize');
const config = require('./config');

// إعداد الاتصال بقاعدة البيانات
const sequelize = new Sequelize(
    config.db.database,
    config.db.username,
    config.db.password,
    config.db
);

// ============================================================
// 1. 🔥 IMPORT MODELS (استيراد النماذج)
// ============================================================

const User = require('./models/User')(sequelize, DataTypes);
const Category = require('./models/Category')(sequelize, DataTypes);
const Product = require('./models/Product')(sequelize, DataTypes);
const PurchaseRequest = require('./models/PurchaseRequest')(sequelize, DataTypes);
const PriceQuote = require('./models/PriceQuote')(sequelize, DataTypes);
const Deal = require('./models/Deal')(sequelize, DataTypes);
const Rating = require('./models/Rating')(sequelize, DataTypes);
const Notification = require('./models/Notification')(sequelize, DataTypes);
const Report = require('./models/Report')(sequelize, DataTypes);
const SmartPricingMatrix = require('./models/SmartPricingMatrix')(sequelize, DataTypes);
const SmartInventory = require('./models/SmartInventory')(sequelize, DataTypes); // New Smart Inventory Model
const RefreshToken = require('./models/RefreshToken')(sequelize, DataTypes);
const AuditLog = require('./models/AuditLog')(sequelize, DataTypes);
const SystemSetting = require('./models/SystemSetting')(sequelize, DataTypes);
const PaymentTransaction = require('./models/PaymentTransaction')(sequelize, DataTypes);
const PaymentMethod = require('./models/PaymentMethod')(sequelize, DataTypes);
const PaymentAuditLog = require('./models/PaymentAuditLog')(sequelize, DataTypes);
const WithdrawalLog = require('./models/WithdrawalLog')(sequelize, DataTypes);

const AlternativeQuote = require('./models/AlternativeQuote')(sequelize, DataTypes);
const Permission = require('./models/Permission')(sequelize, DataTypes);
const Role = require('./models/Role')(sequelize, DataTypes);
const RolePermission = require('./models/RolePermission')(sequelize, DataTypes);
const UserRole = require('./models/UserRole')(sequelize, DataTypes);
const Region = require('./models/Region')(sequelize, DataTypes);
const City = require('./models/City')(sequelize, DataTypes);
const Team = require('./models/Team')(sequelize, DataTypes);
const UserContext = require('./models/UserContext')(sequelize, DataTypes);
const Delegation = require('./models/Delegation')(sequelize, DataTypes);

// Authorization & Context Associations
Role.belongsToMany(Permission, { through: RolePermission, foreignKey: 'roleId', as: 'permissions', onDelete: 'CASCADE' });
Permission.belongsToMany(Role, { through: RolePermission, foreignKey: 'permissionId', as: 'roles', onDelete: 'CASCADE' });

User.belongsToMany(Role, { through: UserRole, foreignKey: 'userId', as: 'roles', onDelete: 'CASCADE' });
Role.belongsToMany(User, { through: UserRole, foreignKey: 'roleId', as: 'users', onDelete: 'CASCADE' });

// Delegation Associations
User.hasMany(Delegation, { foreignKey: 'fromUserId', as: 'delegationsGiven' });
User.hasMany(Delegation, { foreignKey: 'toUserId', as: 'delegationsReceived' });
Delegation.belongsTo(User, { foreignKey: 'fromUserId', as: 'principalUser' });
Delegation.belongsTo(User, { foreignKey: 'toUserId', as: 'delegateUser' });

// Context Hierarchy
Region.hasMany(City, { foreignKey: 'regionId', as: 'cities' });
City.belongsTo(Region, { foreignKey: 'regionId', as: 'region' });

City.hasMany(Team, { foreignKey: 'cityId', as: 'teams' });
Team.belongsTo(City, { foreignKey: 'cityId', as: 'city' });

// User Context
User.hasOne(UserContext, { foreignKey: 'userId', as: 'context' });
UserContext.belongsTo(User, { foreignKey: 'userId', as: 'user' });

UserContext.belongsTo(Region, { foreignKey: 'regionId', as: 'region' });
UserContext.belongsTo(City, { foreignKey: 'cityId', as: 'city' });
UserContext.belongsTo(Team, { foreignKey: 'teamId', as: 'team' });

// ============================================================
// 2. 🔥 DEFINE ASSOCIATIONS (العلاقات)
// ============================================================

// User Associations
User.hasMany(PurchaseRequest, { foreignKey: 'userId', as: 'requests' });
User.hasMany(PriceQuote, { foreignKey: 'sellerId', as: 'quotes' });
User.hasMany(Deal, { foreignKey: 'sellerId', as: 'sellerDeals' });
User.hasMany(Deal, { foreignKey: 'buyerId', as: 'buyerDeals' });
User.hasMany(Rating, { foreignKey: 'raterId', as: 'givenRatings' });
User.hasMany(Rating, { foreignKey: 'ratedUserId', as: 'receivedRatings' });
User.hasMany(Notification, { foreignKey: 'userId', as: 'notifications' });
User.hasMany(Report, { foreignKey: 'reporterId', as: 'submittedReports' });
User.hasMany(Report, { foreignKey: 'reportedUserId', as: 'receivedReports' });
User.hasMany(Product, { foreignKey: 'sellerId', as: 'products' });
// Admin Association (User created by Admin)
User.belongsTo(User, { as: 'adminCreator', foreignKey: 'adminCreatedBy' });

// SmartPricingMatrix Associations (Command 7)
User.hasMany(SmartPricingMatrix, {
    foreignKey: 'sellerId',
    as: 'pricingMatrices',
    onDelete: 'CASCADE'
});
SmartPricingMatrix.belongsTo(User, {
    foreignKey: 'sellerId',
    as: 'seller'
});

// RefreshToken Associations
User.hasMany(RefreshToken, { foreignKey: 'user_id', as: 'refreshTokens' });
RefreshToken.belongsTo(User, { foreignKey: 'user_id', as: 'user' });

// Category Associations
Category.hasMany(PurchaseRequest, { foreignKey: 'categoryId', as: 'requests' });
Category.hasMany(Product, { foreignKey: 'categoryId', as: 'products' });

// Product Associations
Product.belongsTo(User, { foreignKey: 'sellerId', as: 'seller' });
Product.belongsTo(Category, { foreignKey: 'categoryId', as: 'category' });
Product.hasOne(SmartInventory, { foreignKey: 'productId', as: 'smartInventory', onDelete: 'CASCADE' });

// Smart Inventory Associations
SmartInventory.belongsTo(Product, { foreignKey: 'productId', as: 'product' });
SmartInventory.belongsTo(User, { foreignKey: 'sellerId', as: 'seller' });
User.hasMany(SmartInventory, { foreignKey: 'sellerId', as: 'smartInventoryItems' });

// PurchaseRequest Associations
PurchaseRequest.belongsTo(User, { foreignKey: 'userId', as: 'user' });
PurchaseRequest.belongsTo(Category, { foreignKey: 'categoryId', as: 'category' });
PurchaseRequest.hasMany(PriceQuote, { foreignKey: 'purchaseRequestId', as: 'quotes' });
PurchaseRequest.hasOne(Deal, { foreignKey: 'purchaseRequestId', as: 'deal' });
PurchaseRequest.belongsTo(User, { foreignKey: 'targetSellerId', as: 'targetSeller' });

// PriceQuote Associations
PriceQuote.belongsTo(User, { foreignKey: 'sellerId', as: 'seller' });
PriceQuote.belongsTo(PurchaseRequest, { foreignKey: 'purchaseRequestId', as: 'request' });
PriceQuote.hasOne(Deal, { foreignKey: 'priceQuoteId', as: 'deal' });

// Deal Associations
Deal.belongsTo(PurchaseRequest, { foreignKey: 'purchaseRequestId', as: 'purchaseRequest' });
Deal.belongsTo(PriceQuote, { foreignKey: 'priceQuoteId', as: 'priceQuote' });
Deal.belongsTo(User, { foreignKey: 'sellerId', as: 'seller' });
Deal.belongsTo(User, { foreignKey: 'buyerId', as: 'buyer' });

// Rating Associations
Rating.belongsTo(User, { foreignKey: 'raterId', as: 'rater' });
Rating.belongsTo(User, { foreignKey: 'ratedUserId', as: 'ratedUser' });
Rating.belongsTo(Deal, { foreignKey: 'dealId', as: 'deal' });

// Notification Associations
Notification.belongsTo(User, { foreignKey: 'userId', as: 'user' });

// Report Associations
Report.belongsTo(User, { foreignKey: 'reporterId', as: 'reporter' });
Report.belongsTo(User, { foreignKey: 'reportedUserId', as: 'reportedUser' });

// AuditLog Associations
AuditLog.belongsTo(User, { foreignKey: 'userId', as: 'user' }); // Legacy/Main
AuditLog.belongsTo(User, { foreignKey: 'principalId', as: 'principal' });
AuditLog.belongsTo(User, { foreignKey: 'actorId', as: 'actor' });
AuditLog.belongsTo(Delegation, { foreignKey: 'delegationId', as: 'delegation' });

// Payment Associations
PaymentTransaction.belongsTo(User, { foreignKey: 'userId', as: 'user' });
PaymentTransaction.belongsTo(Deal, { foreignKey: 'dealId', as: 'deal' });
PaymentMethod.belongsTo(User, { foreignKey: 'userId', as: 'user' });
PaymentAuditLog.belongsTo(User, { foreignKey: 'userId', as: 'user' });
WithdrawalLog.belongsTo(User, { foreignKey: 'userId', as: 'user' });

// ============================================================
// 3. 🔥 EXPORT MODELS & INIT FUNCTION
// ============================================================

const initSequelize = async () => {
    try {
        await sequelize.authenticate();
        console.log('✅ Database connection established successfully.');
        // Sync models with database
        // NOTE: 'alter: true' disabled to prevent Invalid SQL generation for UNIQUE constraints (Permission model).
        // Schema is managed manually or via scripts/manual_fix_permissions.js.
        // =================================================================
        // SOVEREIGN WARNING: Database schema must only be modified via
        // official migrations. Manual sync is permanently disabled.
        // =================================================================
        await sequelize.sync({ alter: false, force: false });
        console.log('✅ Database synchronized successfully.');
    } catch (error) {
        console.error('❌ Unable to connect to the database:', error);
        throw error;
    }
};

module.exports = {
    sequelize,
    Sequelize, // Export the class for Op access
    initSequelize,
    User,
    Category,
    PurchaseRequest,
    PriceQuote,
    Deal,
    Rating,
    Notification,
    Report,
    SmartPricingMatrix,
    SmartInventory,
    Product,
    RefreshToken,
    AuditLog,
    SystemSetting,
    PaymentTransaction,
    PaymentMethod,
    PaymentAuditLog,
    WithdrawalLog,
    AlternativeQuote,
    Permission,
    Role,
    RolePermission,
    UserRole,
    Region,
    City,
    Team,
    UserContext,
    Delegation
};