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

const AssetType = require("./models/AssetType")(sequelize, DataTypes);
const Product = require("./models/Product")(sequelize, DataTypes);
const PurchaseRequest = require("./models/PurchaseRequest")(
  sequelize,
  DataTypes,
);
const PurchaseRequestItem = require("./models/PurchaseRequestItem")(
  sequelize,
  DataTypes,
);
const PurchaseRequestInvitation = require("./models/PurchaseRequestInvitation")(
  sequelize,
  DataTypes,
);
const Quotation = require("./models/Quotation")(
  sequelize,
  DataTypes,
);
const QuotationItem = require("./models/QuotationItem")(
  sequelize,
  DataTypes,
);
const Award = require("./models/Award")(sequelize, DataTypes);
const AwardLine = require("./models/AwardLine")(sequelize, DataTypes);
const PurchaseOrder = require("./models/PurchaseOrder")(sequelize, DataTypes);
const PurchaseOrderLine = require("./models/PurchaseOrderLine")(sequelize, DataTypes);
const Shipment = require("./models/Shipment")(sequelize, DataTypes);
const ShipmentLine = require("./models/ShipmentLine")(sequelize, DataTypes);
const Receipt = require("./models/Receipt")(sequelize, DataTypes);
const ReceiptLine = require("./models/ReceiptLine")(sequelize, DataTypes);
const PriceQuote = require("./models/PriceQuote")(sequelize, DataTypes);
const Deal = require("./models/Deal")(sequelize, DataTypes);
const Rating = require("./models/Rating")(sequelize, DataTypes);
const Notification = require("./models/Notification")(sequelize, DataTypes);
const SLARecord = require("./models/SLARecord")(sequelize, DataTypes);
const Report = require("./models/Report")(sequelize, DataTypes);
const ProductDNA = require("./models/ProductDNA")(sequelize, DataTypes);
const AttributeSchema = require("./models/AttributeSchema")(sequelize, DataTypes);
const ProductDNAAttribute = require("./models/ProductDNAAttribute")(sequelize, DataTypes);
const SellerListing = require("./models/SellerListing")(sequelize, DataTypes);
const SmartPricingMatrix = require("./models/SmartPricingMatrix")(
  sequelize,
  DataTypes,
);
const SmartInventory = require("./models/SmartInventory")(sequelize, DataTypes);
const InventoryTransaction = require("./models/InventoryTransaction")(sequelize, DataTypes);
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
User.hasMany(EventLog, { foreignKey: "actorId", as: "eventLogs" });

// ============================================================
// 📦 CATALOG (PRODUCT DNA) RELATIONSHIPS
// ============================================================

ProductDNA.belongsTo(Category, { foreignKey: "categoryId", as: "category" });
Category.hasMany(ProductDNA, { foreignKey: "categoryId", as: "productDnas" });

ProductDNA.belongsToMany(AttributeSchema, {
  through: ProductDNAAttribute,
  foreignKey: "dnaId",
  otherKey: "attributeId",
  as: "attributes"
});

AttributeSchema.belongsToMany(ProductDNA, {
  through: ProductDNAAttribute,
  foreignKey: "attributeId",
  otherKey: "dnaId",
  as: "productDnas"
});

ProductDNA.hasMany(ProductDNAAttribute, { foreignKey: "dnaId", as: "dnaAttributes" });
ProductDNAAttribute.belongsTo(ProductDNA, { foreignKey: "dnaId", as: "productDna" });

AttributeSchema.hasMany(ProductDNAAttribute, { foreignKey: "attributeId", as: "schemaAttributes" });
ProductDNAAttribute.belongsTo(AttributeSchema, { foreignKey: "attributeId", as: "attributeSchema" });

// SellerListing Relationships
ProductDNA.hasMany(SellerListing, { foreignKey: "dnaId", as: "sellerListings" });
SellerListing.belongsTo(ProductDNA, { foreignKey: "dnaId", as: "productDna" });

Organization.hasMany(SellerListing, { foreignKey: "organizationId", as: "listings" });
SellerListing.belongsTo(Organization, { foreignKey: "organizationId", as: "organization" });

User.hasMany(SellerListing, { foreignKey: "createdByUserId", as: "createdListings" });
SellerListing.belongsTo(User, { foreignKey: "createdByUserId", as: "creator" });

// Category
Category.hasMany(Product, { foreignKey: "categoryId", as: "products" });
Category.hasMany(PurchaseRequest, { foreignKey: "categoryId", as: "requests" });

// Product
Product.belongsTo(User, { foreignKey: "sellerId", as: "seller" });
Product.belongsTo(Organization, { foreignKey: "ownerOrganizationId", as: "ownerOrganization" }); // Ownership concept
Product.belongsTo(Category, { foreignKey: "categoryId", as: "category" });
Product.belongsTo(AssetType, { foreignKey: "assetTypeId", as: "assetType" });
AssetType.hasMany(Product, { foreignKey: "assetTypeId", as: "products" });

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
PurchaseRequest.belongsTo(AssetType, { foreignKey: "assetTypeId", as: "assetType" });
AssetType.hasMany(PurchaseRequest, { foreignKey: "assetTypeId", as: "requests" });

PurchaseRequest.hasMany(PriceQuote, {
  foreignKey: "purchaseRequestId",
  as: "quotes",
});
PurchaseRequest.hasOne(Deal, { foreignKey: "purchaseRequestId", as: "deal" });

// --- RFQ Multi-line Associations ---
PurchaseRequest.hasMany(PurchaseRequestItem, { foreignKey: "purchaseRequestId", as: "items" });
PurchaseRequestItem.belongsTo(PurchaseRequest, { foreignKey: "purchaseRequestId", as: "request" });

PurchaseRequestItem.belongsTo(ProductDNA, { foreignKey: "productDNAId", as: "productDNA" });
PurchaseRequestItem.belongsTo(Category, { foreignKey: "categoryId", as: "category" });

PurchaseRequest.hasMany(PurchaseRequestInvitation, { foreignKey: "purchaseRequestId", as: "invitations" });
PurchaseRequestInvitation.belongsTo(PurchaseRequest, { foreignKey: "purchaseRequestId", as: "request" });
PurchaseRequestInvitation.belongsTo(Organization, { foreignKey: "sellerOrganizationId", as: "seller" });

Quotation.belongsTo(PurchaseRequest, { foreignKey: "purchaseRequestId", as: "request" });
PurchaseRequest.hasMany(Quotation, { foreignKey: "purchaseRequestId", as: "quotations" });

Quotation.belongsTo(Organization, { foreignKey: "sellerOrganizationId", as: "seller" });
Quotation.belongsTo(PurchaseRequestInvitation, { foreignKey: "invitationId", as: "invitation" });

Quotation.hasMany(QuotationItem, { foreignKey: "quotationId", as: "items" });
QuotationItem.belongsTo(Quotation, { foreignKey: "quotationId", as: "quotation" });
QuotationItem.belongsTo(PurchaseRequestItem, { foreignKey: "purchaseRequestItemId", as: "requestItem" });
QuotationItem.belongsTo(ProductDNA, { foreignKey: "productDNAId", as: "productDNA" });
// -----------------------------------
// --- Award & Negotiation Engine ---
Award.belongsTo(PurchaseRequest, { foreignKey: "purchaseRequestId", as: "request" });
PurchaseRequest.hasMany(Award, { foreignKey: "purchaseRequestId", as: "awards" });
Award.belongsTo(Organization, { foreignKey: "sellerOrganizationId", as: "seller" });
Organization.hasMany(Award, { foreignKey: "sellerOrganizationId", as: "awards" });

Award.hasMany(AwardLine, { foreignKey: "awardId", as: "lines" });
AwardLine.belongsTo(Award, { foreignKey: "awardId", as: "award" });

AwardLine.belongsTo(PurchaseRequestItem, { foreignKey: "purchaseRequestItemId", as: "requestItem" });
PurchaseRequestItem.hasMany(AwardLine, { foreignKey: "purchaseRequestItemId", as: "awardLines" });

AwardLine.belongsTo(QuotationItem, { foreignKey: "quotationItemId", as: "quotationItem" });
QuotationItem.hasMany(AwardLine, { foreignKey: "quotationItemId", as: "awardLines" });

AwardLine.belongsTo(Organization, { foreignKey: "sellerOrganizationId", as: "seller" });
AwardLine.belongsTo(ProductDNA, { foreignKey: "productDNAId", as: "productDNA" });

// --- Purchase Order Engine ---
PurchaseOrder.belongsTo(Award, { foreignKey: "awardId", as: "award" });
Award.hasOne(PurchaseOrder, { foreignKey: "awardId", as: "purchaseOrder" });

PurchaseOrder.belongsTo(User, { foreignKey: "buyerId", as: "buyer" });
PurchaseOrder.belongsTo(Organization, { foreignKey: "sellerOrganizationId", as: "seller" });

PurchaseOrder.hasMany(PurchaseOrderLine, { foreignKey: "purchaseOrderId", as: "lines" });
PurchaseOrderLine.belongsTo(PurchaseOrder, { foreignKey: "purchaseOrderId", as: "purchaseOrder" });

PurchaseOrderLine.belongsTo(AwardLine, { foreignKey: "awardLineId", as: "awardLine" });
AwardLine.hasOne(PurchaseOrderLine, { foreignKey: "awardLineId", as: "purchaseOrderLine" });

PurchaseOrderLine.belongsTo(ProductDNA, { foreignKey: "productDNAId", as: "productDNA" });

// --- Fulfillment Engine ---
Shipment.belongsTo(PurchaseOrder, { foreignKey: "purchaseOrderId", as: "purchaseOrder" });
PurchaseOrder.hasMany(Shipment, { foreignKey: "purchaseOrderId", as: "shipments" });

Shipment.belongsTo(Organization, { foreignKey: "sellerOrganizationId", as: "seller" });

Shipment.hasMany(ShipmentLine, { foreignKey: "shipmentId", as: "lines" });
ShipmentLine.belongsTo(Shipment, { foreignKey: "shipmentId", as: "shipment" });

ShipmentLine.belongsTo(PurchaseOrderLine, { foreignKey: "purchaseOrderLineId", as: "purchaseOrderLine" });

Receipt.belongsTo(PurchaseOrder, { foreignKey: "purchaseOrderId", as: "purchaseOrder" });
PurchaseOrder.hasMany(Receipt, { foreignKey: "purchaseOrderId", as: "receipts" });

Receipt.belongsTo(Shipment, { foreignKey: "shipmentId", as: "shipment" });
Shipment.hasMany(Receipt, { foreignKey: "shipmentId", as: "receipts" });

Receipt.belongsTo(User, { foreignKey: "buyerId", as: "buyer" });

Receipt.hasMany(ReceiptLine, { foreignKey: "receiptId", as: "lines" });
ReceiptLine.belongsTo(Receipt, { foreignKey: "receiptId", as: "receipt" });

ReceiptLine.belongsTo(PurchaseOrderLine, { foreignKey: "purchaseOrderLineId", as: "purchaseOrderLine" });
// -----------------------------------
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
  try {
    const rawDbUrl = config.db.database || process.env.DATABASE_URL || '';
    let safeUrl = rawDbUrl;
    if (rawDbUrl.includes('postgres://')) {
      safeUrl = rawDbUrl.replace(/:([^:@]+)@/, ':***@');
    }
    console.log('\n--- DB CONNECTION DIAGNOSTICS ---');
    console.log('SAFE DATABASE_URL:', safeUrl);
    console.log('HOST:', config.db.host);
    console.log('DATABASE:', config.db.database);
    console.log('USER:', config.db.username);
    
    await sequelize.authenticate();
    
    console.log('\n--- RAW SQL STARTUP DIAGNOSTICS ---');
    const [dbRes] = await sequelize.query('SELECT current_database() as db;');
    const [userRes] = await sequelize.query('SELECT current_user as usr;');
    const [verRes] = await sequelize.query('SELECT version() as ver;');
    
    console.log('CURRENT DATABASE:', dbRes[0].db);
    console.log('CURRENT USER:', userRes[0].usr);
    console.log('POSTGRES VERSION:', verRes[0].ver);
    console.log('---------------------------------\n');

  } catch(e) {
    console.error('DB STARTUP ERROR:', e);
  }

  if (process.env.RENDER !== "true") {
    // For PostgreSQL: disable constraints during sync
    const PaymentMethod = sequelize.models.PaymentMethod;
    const User = sequelize.models.User;
    
    console.log("USER_TABLE =", User?.getTableName());
    
    console.log(
      "PAYMENT_METHOD_REFERENCE =",
      PaymentMethod?.rawAttributes?.userId?.references
    );
    
    console.log(
      "PAYMENT_METHOD_USERID =",
      PaymentMethod?.rawAttributes?.userId
    );

    try {
      await sequelize.query('SET CONSTRAINTS ALL DEFERRED');
      
      console.log('📦 Creating independent tables...');
      await User.sync({ alter: { drop: false } });        // لا يعتمد على أحد
      await Category.sync({ alter: { drop: false } });    // لا يعتمد على أحد

      console.log('🔗 Creating dependent tables...');
      await PurchaseRequest.sync({ alter: { drop: false } });   // يعتمد على User و Category
      await PriceQuote.sync({ alter: { drop: false } });        // يعتمد على User و PurchaseRequest (Note: model is PriceQuote, not Quote)
      await Deal.sync({ alter: { drop: false } });              // يعتمد على PriceQuote و User
      await PaymentMethod.sync({ alter: { drop: false } });     // يعتمد على User
      
      // Sync the rest of the 30+ tables
      console.log('🔄 Syncing remaining tables...');
      await sequelize.sync({ alter: false, force: false });
      
      console.log("✅ Database synchronized successfully in ordered sequence!");
    } catch (error) {
      console.error('❌ Sequelize sync failed:', error);
      throw error;
    }
  } else {
    console.log("✅ Render environment detected. Skipping auto-sync on startup.");
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
  AssetType,

  Product,
  PurchaseRequest,
  PurchaseRequestItem,
  PurchaseRequestInvitation,
  Quotation,
  QuotationItem,
  Award,
  AwardLine,
  PurchaseOrder,
  PurchaseOrderLine,
  Shipment,
  ShipmentLine,
  Receipt,
  ReceiptLine,
  PriceQuote,
  Deal,
  Rating,
  Notification,
  SLARecord,
  Report,

  SmartPricingMatrix,
  SmartInventory,
  InventoryTransaction,
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
  ProductDNA,
  AttributeSchema,
  ProductDNAAttribute,
  SellerListing,
};
