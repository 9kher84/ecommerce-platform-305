const { Sequelize, DataTypes } = require("sequelize");
const config = require("./config");

// ============================================================
// 🔥 DATABASE CONNECTION
// ============================================================

const sequelize = new Sequelize(
  config.db.database,
  config.db.username,
  config.db.password,
  config.db,
);

// ============================================================
// 🔥 IMPORT MODELS
// ============================================================

const User = require("./models/User")(sequelize, DataTypes);
const Category = require("./models/Category")(sequelize, DataTypes);
const UserCategory = require("./models/UserCategory")(sequelize, DataTypes);
const Organization = require("./models/Organization")(sequelize);
const OrganizationUser = require("./models/OrganizationUser")(sequelize);

const Product = require("./models/Product")(sequelize, DataTypes);
const PurchaseRequest = require("./models/PurchaseRequest")(
  sequelize,
  DataTypes,
);
const PriceQuote = require("./models/PriceQuote")(sequelize, DataTypes);
const Deal = require("./models/Deal")(sequelize, DataTypes);
const Rating = require("./models/Rating")(sequelize, DataTypes);
const Notification = require("./models/Notification")(sequelize, DataTypes);
const Report = require("./models/Report")(sequelize, DataTypes);

const SmartPricingMatrix = require("./models/SmartPricingMatrix")(
  sequelize,
  DataTypes,
);
const SmartInventory = require("./models/SmartInventory")(sequelize, DataTypes);
const RefreshToken = require("./models/RefreshToken")(sequelize, DataTypes);

const AuditLog = require("./models/AuditLog")(sequelize, DataTypes);
const ActionLog = require("./models/ActionLog")(sequelize, DataTypes);
const SystemSetting = require("./models/SystemSetting")(sequelize, DataTypes);
const InventoryMetrics = require("./models/InventoryMetrics")(
  sequelize,
  DataTypes,
);
const AutoReplenishmentOrder = require("./models/AutoReplenishmentOrder")(
  sequelize,
  DataTypes,
);

const PaymentTransaction = require("./models/PaymentTransaction")(
  sequelize,
  DataTypes,
);
const PaymentMethod = require("./models/PaymentMethod")(sequelize, DataTypes);
const PaymentAuditLog = require("./models/PaymentAuditLog")(
  sequelize,
  DataTypes,
);
const WithdrawalLog = require("./models/WithdrawalLog")(sequelize, DataTypes);

const AlternativeQuote = require("./models/AlternativeQuote")(
  sequelize,
  DataTypes,
);

const Permission = require("./models/Permission")(sequelize, DataTypes);
const Role = require("./models/Role")(sequelize, DataTypes);
const RolePermission = require("./models/RolePermission")(sequelize, DataTypes);
const UserRole = require("./models/UserRole")(sequelize, DataTypes);

const Region = require("./models/Region")(sequelize, DataTypes);
const City = require("./models/City")(sequelize, DataTypes);
const Team = require("./models/Team")(sequelize, DataTypes);
const UserContext = require("./models/UserContext")(sequelize, DataTypes);

const Delegation = require("./models/Delegation")(sequelize, DataTypes);
const SellerDecision = require("./models/SellerDecision")(sequelize, DataTypes);
const BuyerDecisionContext = require("./models/BuyerDecisionContext")(
  sequelize,
  DataTypes,
);
const MarketSilenceEvent = require("./models/MarketSilenceEvent")(
  sequelize,
  DataTypes,
);
const SellerInteractionEvent = require("./models/SellerInteractionEvent")(
  sequelize,
  DataTypes,
);
const BuyerLimit = require("./models/BuyerLimit")(sequelize, DataTypes);
const CommissionTransaction = require("./models/CommissionTransaction")(
  sequelize,
  DataTypes,
);
const EventLog = require("./models/EventLog")(sequelize, Sequelize.DataTypes);
const TrustScore = require("./models/TrustScore")(
  sequelize,
  Sequelize.DataTypes,
);
const Sanction = require("./models/Sanction")(sequelize, Sequelize.DataTypes);
const AdminActionLog = require("./models/AdminActionLog")(
  sequelize,
  Sequelize.DataTypes,
);
const Invoice = require("./models/Invoice")(sequelize, Sequelize.DataTypes);
const SupervisorAssignment = require("./models/SupervisorAssignment")(
  sequelize,
  Sequelize.DataTypes,
);
const SupervisorCommissionShare = require("./models/SupervisorCommissionShare")(
  sequelize,
  Sequelize.DataTypes,
);
const SupervisorNotification = require("./models/SupervisorNotification")(
  sequelize,
  Sequelize.DataTypes,
);
const RegionAssignment = require("./models/RegionAssignment")(
  sequelize,
  Sequelize.DataTypes,
);
const FailedNotification = require("./models/FailedNotification")(
  sequelize,
  Sequelize.DataTypes,
);

// ============================================================
// 🔥 AUTHORIZATION & CONTEXT
// ============================================================

Role.belongsToMany(Permission, {
  through: RolePermission,
  foreignKey: "roleId",
  as: "permissions",
});
Permission.belongsToMany(Role, {
  through: RolePermission,
  foreignKey: "permissionId",
  as: "roles",
});

User.belongsToMany(Role, {
  through: UserRole,
  foreignKey: "userId",
  as: "roles",
});
Role.belongsToMany(User, {
  through: UserRole,
  foreignKey: "roleId",
  as: "users",
});

User.belongsToMany(Organization, {
  through: OrganizationUser,
  foreignKey: "user_id",
  as: "organizations",
});
Organization.belongsToMany(User, {
  through: OrganizationUser,
  foreignKey: "organization_id",
  as: "users",
});
PurchaseRequest.belongsTo(Organization, {
  foreignKey: "organization_id",
  as: "organization",
});
Organization.hasMany(PurchaseRequest, {
  foreignKey: "organization_id",
  as: "purchaseRequests",
});
PriceQuote.belongsTo(Organization, {
  foreignKey: "organization_id",
  as: "organization",
});
Organization.hasMany(PriceQuote, {
  foreignKey: "organization_id",
  as: "priceQuotes",
});
Deal.belongsTo(Organization, {
  foreignKey: "organization_id",
  as: "organization",
});
Organization.hasMany(Deal, { foreignKey: "organization_id", as: "deals" });
AuditLog.belongsTo(Organization, {
  foreignKey: "organization_id",
  as: "organization",
});
Organization.hasMany(AuditLog, {
  foreignKey: "organization_id",
  as: "auditLogs",
});

User.hasMany(Delegation, { foreignKey: "fromUserId", as: "delegationsGiven" });
User.hasMany(Delegation, { foreignKey: "toUserId", as: "delegationsReceived" });
Delegation.belongsTo(User, { foreignKey: "fromUserId", as: "principalUser" });
Delegation.belongsTo(User, { foreignKey: "toUserId", as: "delegateUser" });

// ============================================================
// 🔥 CATEGORY – SOVEREIGN TAXONOMY (THIS WAS THE MISSING CORE)
// ============================================================

// Category Hierarchy (Sector → SubCategories)
Category.hasMany(Category, {
  as: "subCategories",
  foreignKey: "parentId",
});
Category.belongsTo(Category, {
  as: "parent",
  foreignKey: "parentId",
});

// User ↔ Sector (ONLY SECTOR ALLOWED – enforced in UserCategory model)
User.belongsToMany(Category, {
  through: UserCategory,
  foreignKey: "userId",
  as: "sectors",
});

Category.belongsToMany(User, {
  through: UserCategory,
  foreignKey: "categoryId",
  as: "users",
});

// ============================================================
// 🔥 CORE BUSINESS ASSOCIATIONS
// ============================================================

// User
User.hasMany(PurchaseRequest, { foreignKey: "userId", as: "requests" });
User.hasMany(Product, { foreignKey: "sellerId", as: "products" });
User.hasMany(Notification, { foreignKey: "userId", as: "notifications" });

// User ↔ Invoice
User.hasMany(Invoice, { foreignKey: "buyer_id", as: "buyerInvoices" });
User.hasMany(Invoice, { foreignKey: "seller_id", as: "sellerInvoices" });
Invoice.belongsTo(User, { foreignKey: "buyer_id", as: "buyer" });
Invoice.belongsTo(User, { foreignKey: "seller_id", as: "seller" });

// Deal ↔ Invoice
Deal.belongsTo(Invoice, { foreignKey: "invoice_id", as: "dealInvoice" });
Invoice.hasOne(Deal, { foreignKey: "invoice_id", as: "deal" });

// Invoice ↔ CommissionTransaction
Invoice.hasMany(CommissionTransaction, {
  foreignKey: "invoice_id",
  as: "commissions",
});
CommissionTransaction.belongsTo(Invoice, {
  foreignKey: "invoice_id",
  as: "invoice",
});

// System Logging
User.hasMany(EventLog, { foreignKey: "actor_id", as: "events" });

// Category
Category.hasMany(Product, { foreignKey: "categoryId", as: "products" });
Category.hasMany(PurchaseRequest, { foreignKey: "categoryId", as: "requests" });

// Product
Product.belongsTo(User, { foreignKey: "sellerId", as: "seller" });
Product.belongsTo(Category, { foreignKey: "categoryId", as: "category" });
Product.hasOne(SmartInventory, {
  foreignKey: "productId",
  as: "smartInventory",
});

// Smart Inventory
SmartInventory.belongsTo(Product, { foreignKey: "productId", as: "product" });
SmartInventory.belongsTo(User, { foreignKey: "sellerId", as: "seller" });
SmartInventory.hasOne(InventoryMetrics, {
  foreignKey: "inventoryId",
  as: "metrics",
});
InventoryMetrics.belongsTo(SmartInventory, {
  foreignKey: "inventoryId",
  as: "inventory",
});
SmartInventory.hasMany(AutoReplenishmentOrder, {
  foreignKey: "inventoryId",
  as: "replenishmentOrders",
});
AutoReplenishmentOrder.belongsTo(SmartInventory, {
  foreignKey: "inventoryId",
  as: "inventory",
});

// Purchase Request
PurchaseRequest.belongsTo(User, { foreignKey: "userId", as: "user" });
PurchaseRequest.belongsTo(Category, {
  foreignKey: "categoryId",
  as: "category",
});
PurchaseRequest.hasMany(PriceQuote, {
  foreignKey: "purchaseRequestId",
  as: "quotes",
});
PurchaseRequest.hasOne(Deal, { foreignKey: "purchaseRequestId", as: "deal" });

// Price Quote
PriceQuote.belongsTo(User, { foreignKey: "sellerId", as: "seller" });
PriceQuote.belongsTo(PurchaseRequest, {
  foreignKey: "purchaseRequestId",
  as: "request",
});
PriceQuote.hasOne(Deal, { foreignKey: "priceQuoteId", as: "deal" });

// Deal
Deal.belongsTo(User, { foreignKey: "sellerId", as: "seller" });
Deal.belongsTo(User, { foreignKey: "buyerId", as: "buyer" });
Deal.belongsTo(PurchaseRequest, {
  foreignKey: "purchaseRequestId",
  as: "purchaseRequest",
});

// Selection Decision Associations
SellerDecision.belongsTo(User, { foreignKey: "userId", as: "user" });
SellerDecision.belongsTo(PurchaseRequest, {
  foreignKey: "requestId",
  as: "request",
});
User.hasMany(SellerDecision, { foreignKey: "userId", as: "decisions" });

// Buyer Decision Context Associations
BuyerDecisionContext.belongsTo(User, { foreignKey: "buyerId", as: "buyer" });
BuyerDecisionContext.belongsTo(PriceQuote, {
  foreignKey: "quoteId",
  as: "quote",
});
BuyerDecisionContext.belongsTo(PurchaseRequest, {
  foreignKey: "requestId",
  as: "request",
});
User.hasMany(BuyerDecisionContext, {
  foreignKey: "buyerId",
  as: "buyerDecisions",
});

// Market Monitoring Associations
MarketSilenceEvent.belongsTo(Category, {
  foreignKey: "sectorId",
  as: "sector",
});
MarketSilenceEvent.belongsTo(PurchaseRequest, {
  foreignKey: "requestId",
  as: "request",
});

SellerInteractionEvent.belongsTo(User, {
  foreignKey: "sellerId",
  as: "seller",
});
SellerInteractionEvent.belongsTo(PurchaseRequest, {
  foreignKey: "requestId",
  as: "request",
});
User.hasMany(SellerInteractionEvent, {
  foreignKey: "sellerId",
  as: "interactions",
});

// Buyer limits & Commission
BuyerLimit.belongsTo(User, { foreignKey: "buyerId", as: "buyer" });
User.hasOne(BuyerLimit, { foreignKey: "buyerId", as: "limit" });

CommissionTransaction.belongsTo(Deal, { foreignKey: "dealId", as: "deal" });
CommissionTransaction.belongsTo(User, { foreignKey: "sellerId", as: "seller" });
CommissionTransaction.belongsTo(User, { foreignKey: "buyerId", as: "buyer" });
Deal.hasOne(CommissionTransaction, { foreignKey: "dealId", as: "commission" });

SupervisorAssignment.belongsTo(Deal, { foreignKey: "deal_id", as: "deal" });
SupervisorAssignment.belongsTo(User, {
  foreignKey: "supervisor_id",
  as: "supervisor",
});
SupervisorAssignment.belongsTo(User, {
  foreignKey: "assigned_by",
  as: "assigner",
});
Deal.hasMany(SupervisorAssignment, {
  foreignKey: "deal_id",
  as: "supervisorAssignments",
});
User.hasMany(SupervisorAssignment, {
  foreignKey: "supervisor_id",
  as: "assignmentsAsSupervisor",
});

SupervisorCommissionShare.belongsTo(SupervisorAssignment, {
  foreignKey: "assignment_id",
  as: "assignment",
});
SupervisorCommissionShare.belongsTo(User, {
  foreignKey: "supervisor_id",
  as: "supervisor",
});
SupervisorCommissionShare.belongsTo(Deal, {
  foreignKey: "deal_id",
  as: "deal",
});
SupervisorAssignment.hasMany(SupervisorCommissionShare, {
  foreignKey: "assignment_id",
  as: "commissionShares",
});

SupervisorNotification.belongsTo(User, {
  foreignKey: "supervisor_id",
  as: "supervisor",
});
SupervisorNotification.belongsTo(Deal, { foreignKey: "deal_id", as: "deal" });
User.hasMany(SupervisorNotification, {
  foreignKey: "supervisor_id",
  as: "supervisorNotifications",
});

RegionAssignment.belongsTo(User, {
  foreignKey: "supervisor_id",
  as: "supervisor",
});
RegionAssignment.belongsTo(User, { foreignKey: "assigned_by", as: "assigner" });

// ============================================================
// 🔥 INIT
// ============================================================

const initSequelize = async () => {
  await sequelize.authenticate();

  const isCloud = process.env.RENDER === "true" || process.env.RAILWAY_ENVIRONMENT || process.env.NODE_ENV === "production";

  if (!isCloud) {
    // Development: simple sync
    await sequelize.sync({ alter: false, force: false });
  } else {
    // Cloud (Railway/Render): sync safely in dependency order
    console.log("☁️ Cloud environment detected. Syncing tables in FK-safe order...");
    try {
      // Disable FK checks temporarily to avoid ordering issues
      await sequelize.query("SET session_replication_role = 'replica';").catch(() => {});

      // Tier 1: Independent tables (no FKs)
      await User.sync({ alter: true });
      await Category.sync({ alter: true });
      await Region.sync({ alter: true });
      await Permission.sync({ alter: true });
      await Role.sync({ alter: true });
      await Organization.sync({ alter: true });
      await SystemSetting.sync({ alter: true });

      // Tier 2: Depend on Tier 1
      await UserCategory.sync({ alter: true });
      await OrganizationUser.sync({ alter: true });
      await RolePermission.sync({ alter: true });
      await UserRole.sync({ alter: true });
      await City.sync({ alter: true });
      await Team.sync({ alter: true });
      await RefreshToken.sync({ alter: true });
      await AuditLog.sync({ alter: true });
      await ActionLog.sync({ alter: true });
      await UserContext.sync({ alter: true });
      await PaymentMethod.sync({ alter: true });
      await TrustScore.sync({ alter: true });
      await Sanction.sync({ alter: true });
      await BuyerLimit.sync({ alter: true });

      // Tier 3: Depend on Tier 1 + 2
      await Product.sync({ alter: true });
      await PurchaseRequest.sync({ alter: true });
      await PriceQuote.sync({ alter: true });
      await Deal.sync({ alter: true });
      await Rating.sync({ alter: true });
      await Notification.sync({ alter: true });
      await Report.sync({ alter: true });
      await FailedNotification.sync({ alter: true });

      // Tier 4: Depend on higher tiers
      await SmartPricingMatrix.sync({ alter: true });
      await SmartInventory.sync({ alter: true });
      await InventoryMetrics.sync({ alter: true });
      await AutoReplenishmentOrder.sync({ alter: true });
      await PaymentTransaction.sync({ alter: true });
      await PaymentAuditLog.sync({ alter: true });
      await WithdrawalLog.sync({ alter: true });
      await AlternativeQuote.sync({ alter: true });
      await CommissionTransaction.sync({ alter: true });
      await EventLog.sync({ alter: true });
      await AdminActionLog.sync({ alter: true });
      await Invoice.sync({ alter: true });
      await Delegation.sync({ alter: true });
      await SellerDecision.sync({ alter: true });
      await BuyerDecisionContext.sync({ alter: true });
      await MarketSilenceEvent.sync({ alter: true });
      await SellerInteractionEvent.sync({ alter: true });
      await SupervisorAssignment.sync({ alter: true });
      await SupervisorCommissionShare.sync({ alter: true });
      await SupervisorNotification.sync({ alter: true });
      await RegionAssignment.sync({ alter: true });

      // Re-enable FK checks
      await sequelize.query("SET session_replication_role = 'origin';").catch(() => {});

      console.log("✅ All tables synced successfully in FK-safe order.");
    } catch (err) {
      await sequelize.query("SET session_replication_role = 'origin';").catch(() => {});
      throw err;
    }
  }
};

// ============================================================
// 🔥 EXPORTS (THIS IS WHAT FIXES EVERYTHING)
// ============================================================

module.exports = {
  sequelize,
  Sequelize,
  initSequelize,

  User,
  Category,
  UserCategory,

  Product,
  PurchaseRequest,
  PriceQuote,
  Deal,
  Rating,
  Notification,
  Report,

  SmartPricingMatrix,
  SmartInventory,
  RefreshToken,

  AuditLog,
  ActionLog,
  SystemSetting,
  InventoryMetrics,
  AutoReplenishmentOrder,

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

  Delegation,
  SellerDecision,
  BuyerDecisionContext,
  MarketSilenceEvent,
  SellerInteractionEvent,
  BuyerLimit,
  CommissionTransaction,
  EventLog,
  TrustScore,
  Sanction,
  AdminActionLog,
  Invoice,
  SupervisorAssignment,
  SupervisorCommissionShare,
  SupervisorNotification,
  RegionAssignment,
  Organization,
  OrganizationUser,
  FailedNotification,
};
