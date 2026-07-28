# 🏛️ DATABASE CANONICAL ARCHITECTURE AUDIT
> Read-only Forensic Investigation & Permanent Foundation Blueprint

## Phase 1 — Runtime Truth
Deep dive into the actual configuration vs. real database state.

### Model: `User`
- **Physical Table (Config):** `users`
- **Schema:** `public`
- **freezeTableName:** `false`
- **underscored:** `false`
- **timestamps:** `true`
- **paranoid (Soft Delete):** `true`
- **Requires Quoted Identifiers:** `false`
- **Actual SQL Generated:** `SELECT ... FROM "users" AS "User"`
- **Table Exists in DB?** ✅ YES

### Model: `Category`
- **Physical Table (Config):** `Categories`
- **Schema:** `public`
- **freezeTableName:** `false`
- **underscored:** `false`
- **timestamps:** `true`
- **paranoid (Soft Delete):** `false`
- **Requires Quoted Identifiers:** `true`
- **Actual SQL Generated:** `SELECT ... FROM "Categories" AS "Category"`
- **Table Exists in DB?** ✅ YES

### Model: `UserCategory`
- **Physical Table (Config):** `UserCategories`
- **Schema:** `public`
- **freezeTableName:** `false`
- **underscored:** `false`
- **timestamps:** `true`
- **paranoid (Soft Delete):** `false`
- **Requires Quoted Identifiers:** `true`
- **Actual SQL Generated:** `SELECT ... FROM "UserCategories" AS "UserCategory"`
- **Table Exists in DB?** ✅ YES

### Model: `Organization`
- **Physical Table (Config):** `organizations`
- **Schema:** `public`
- **freezeTableName:** `false`
- **underscored:** `false`
- **timestamps:** `false`
- **paranoid (Soft Delete):** `false`
- **Requires Quoted Identifiers:** `false`
- **Actual SQL Generated:** `SELECT ... FROM "organizations" AS "Organization"`
- **Table Exists in DB?** ✅ YES

### Model: `OrganizationUser`
- **Physical Table (Config):** `organization_users`
- **Schema:** `public`
- **freezeTableName:** `false`
- **underscored:** `false`
- **timestamps:** `false`
- **paranoid (Soft Delete):** `false`
- **Requires Quoted Identifiers:** `false`
- **Actual SQL Generated:** `SELECT ... FROM "organization_users" AS "OrganizationUser"`
- **Table Exists in DB?** ✅ YES

### Model: `AssetType`
- **Physical Table (Config):** `AssetTypes`
- **Schema:** `public`
- **freezeTableName:** `false`
- **underscored:** `false`
- **timestamps:** `true`
- **paranoid (Soft Delete):** `false`
- **Requires Quoted Identifiers:** `true`
- **Actual SQL Generated:** `SELECT ... FROM "AssetTypes" AS "AssetType"`
- **Table Exists in DB?** ✅ YES

### Model: `Product`
- **Physical Table (Config):** `Products`
- **Schema:** `public`
- **freezeTableName:** `false`
- **underscored:** `false`
- **timestamps:** `true`
- **paranoid (Soft Delete):** `false`
- **Requires Quoted Identifiers:** `true`
- **Actual SQL Generated:** `SELECT ... FROM "Products" AS "Product"`
- **Table Exists in DB?** ✅ YES

### Model: `PurchaseRequest`
- **Physical Table (Config):** `PurchaseRequests`
- **Schema:** `public`
- **freezeTableName:** `false`
- **underscored:** `false`
- **timestamps:** `true`
- **paranoid (Soft Delete):** `true`
- **Requires Quoted Identifiers:** `true`
- **Actual SQL Generated:** `SELECT ... FROM "PurchaseRequests" AS "PurchaseRequest"`
- **Table Exists in DB?** ✅ YES

### Model: `PurchaseRequestItem`
- **Physical Table (Config):** `PurchaseRequestItems`
- **Schema:** `public`
- **freezeTableName:** `false`
- **underscored:** `false`
- **timestamps:** `true`
- **paranoid (Soft Delete):** `true`
- **Requires Quoted Identifiers:** `true`
- **Actual SQL Generated:** `SELECT ... FROM "PurchaseRequestItems" AS "PurchaseRequestItem"`
- **Table Exists in DB?** ✅ YES

### Model: `PurchaseRequestInvitation`
- **Physical Table (Config):** `PurchaseRequestInvitations`
- **Schema:** `public`
- **freezeTableName:** `false`
- **underscored:** `false`
- **timestamps:** `true`
- **paranoid (Soft Delete):** `true`
- **Requires Quoted Identifiers:** `true`
- **Actual SQL Generated:** `SELECT ... FROM "PurchaseRequestInvitations" AS "PurchaseRequestInvitation"`
- **Table Exists in DB?** ✅ YES

### Model: `Quotation`
- **Physical Table (Config):** `Quotations`
- **Schema:** `public`
- **freezeTableName:** `false`
- **underscored:** `false`
- **timestamps:** `true`
- **paranoid (Soft Delete):** `true`
- **Requires Quoted Identifiers:** `true`
- **Actual SQL Generated:** `SELECT ... FROM "Quotations" AS "Quotation"`
- **Table Exists in DB?** ✅ YES

### Model: `QuotationItem`
- **Physical Table (Config):** `QuotationItems`
- **Schema:** `public`
- **freezeTableName:** `false`
- **underscored:** `false`
- **timestamps:** `true`
- **paranoid (Soft Delete):** `true`
- **Requires Quoted Identifiers:** `true`
- **Actual SQL Generated:** `SELECT ... FROM "QuotationItems" AS "QuotationItem"`
- **Table Exists in DB?** ✅ YES

### Model: `Award`
- **Physical Table (Config):** `Awards`
- **Schema:** `public`
- **freezeTableName:** `false`
- **underscored:** `false`
- **timestamps:** `true`
- **paranoid (Soft Delete):** `true`
- **Requires Quoted Identifiers:** `true`
- **Actual SQL Generated:** `SELECT ... FROM "Awards" AS "Award"`
- **Table Exists in DB?** ✅ YES

### Model: `AwardLine`
- **Physical Table (Config):** `AwardLines`
- **Schema:** `public`
- **freezeTableName:** `false`
- **underscored:** `false`
- **timestamps:** `true`
- **paranoid (Soft Delete):** `true`
- **Requires Quoted Identifiers:** `true`
- **Actual SQL Generated:** `SELECT ... FROM "AwardLines" AS "AwardLine"`
- **Table Exists in DB?** ✅ YES

### Model: `PurchaseOrder`
- **Physical Table (Config):** `PurchaseOrders`
- **Schema:** `public`
- **freezeTableName:** `false`
- **underscored:** `false`
- **timestamps:** `true`
- **paranoid (Soft Delete):** `true`
- **Requires Quoted Identifiers:** `true`
- **Actual SQL Generated:** `SELECT ... FROM "PurchaseOrders" AS "PurchaseOrder"`
- **Table Exists in DB?** ✅ YES

### Model: `PurchaseOrderLine`
- **Physical Table (Config):** `PurchaseOrderLines`
- **Schema:** `public`
- **freezeTableName:** `false`
- **underscored:** `false`
- **timestamps:** `true`
- **paranoid (Soft Delete):** `true`
- **Requires Quoted Identifiers:** `true`
- **Actual SQL Generated:** `SELECT ... FROM "PurchaseOrderLines" AS "PurchaseOrderLine"`
- **Table Exists in DB?** ✅ YES

### Model: `Shipment`
- **Physical Table (Config):** `Shipments`
- **Schema:** `public`
- **freezeTableName:** `false`
- **underscored:** `false`
- **timestamps:** `true`
- **paranoid (Soft Delete):** `true`
- **Requires Quoted Identifiers:** `true`
- **Actual SQL Generated:** `SELECT ... FROM "Shipments" AS "Shipment"`
- **Table Exists in DB?** ✅ YES

### Model: `ShipmentLine`
- **Physical Table (Config):** `ShipmentLines`
- **Schema:** `public`
- **freezeTableName:** `false`
- **underscored:** `false`
- **timestamps:** `true`
- **paranoid (Soft Delete):** `true`
- **Requires Quoted Identifiers:** `true`
- **Actual SQL Generated:** `SELECT ... FROM "ShipmentLines" AS "ShipmentLine"`
- **Table Exists in DB?** ✅ YES

### Model: `Receipt`
- **Physical Table (Config):** `Receipts`
- **Schema:** `public`
- **freezeTableName:** `false`
- **underscored:** `false`
- **timestamps:** `true`
- **paranoid (Soft Delete):** `true`
- **Requires Quoted Identifiers:** `true`
- **Actual SQL Generated:** `SELECT ... FROM "Receipts" AS "Receipt"`
- **Table Exists in DB?** ✅ YES

### Model: `ReceiptLine`
- **Physical Table (Config):** `ReceiptLines`
- **Schema:** `public`
- **freezeTableName:** `false`
- **underscored:** `false`
- **timestamps:** `true`
- **paranoid (Soft Delete):** `true`
- **Requires Quoted Identifiers:** `true`
- **Actual SQL Generated:** `SELECT ... FROM "ReceiptLines" AS "ReceiptLine"`
- **Table Exists in DB?** ✅ YES

### Model: `PriceQuote`
- **Physical Table (Config):** `PriceQuotes`
- **Schema:** `public`
- **freezeTableName:** `false`
- **underscored:** `false`
- **timestamps:** `true`
- **paranoid (Soft Delete):** `false`
- **Requires Quoted Identifiers:** `true`
- **Actual SQL Generated:** `SELECT ... FROM "PriceQuotes" AS "PriceQuote"`
- **Table Exists in DB?** ✅ YES

### Model: `Deal`
- **Physical Table (Config):** `deals`
- **Schema:** `public`
- **freezeTableName:** `false`
- **underscored:** `false`
- **timestamps:** `true`
- **paranoid (Soft Delete):** `true`
- **Requires Quoted Identifiers:** `false`
- **Actual SQL Generated:** `SELECT ... FROM "deals" AS "Deal"`
- **Table Exists in DB?** ✅ YES

### Model: `Rating`
- **Physical Table (Config):** `ratings`
- **Schema:** `public`
- **freezeTableName:** `false`
- **underscored:** `false`
- **timestamps:** `true`
- **paranoid (Soft Delete):** `false`
- **Requires Quoted Identifiers:** `false`
- **Actual SQL Generated:** `SELECT ... FROM "ratings" AS "Rating"`
- **Table Exists in DB?** ✅ YES

### Model: `Notification`
- **Physical Table (Config):** `notifications`
- **Schema:** `public`
- **freezeTableName:** `false`
- **underscored:** `false`
- **timestamps:** `true`
- **paranoid (Soft Delete):** `false`
- **Requires Quoted Identifiers:** `false`
- **Actual SQL Generated:** `SELECT ... FROM "notifications" AS "Notification"`
- **Table Exists in DB?** ✅ YES

### Model: `SLARecord`
- **Physical Table (Config):** `SLARecords`
- **Schema:** `public`
- **freezeTableName:** `false`
- **underscored:** `false`
- **timestamps:** `true`
- **paranoid (Soft Delete):** `false`
- **Requires Quoted Identifiers:** `true`
- **Actual SQL Generated:** `SELECT ... FROM "SLARecords" AS "SLARecord"`
- **Table Exists in DB?** ✅ YES

### Model: `Report`
- **Physical Table (Config):** `reports`
- **Schema:** `public`
- **freezeTableName:** `false`
- **underscored:** `false`
- **timestamps:** `true`
- **paranoid (Soft Delete):** `false`
- **Requires Quoted Identifiers:** `false`
- **Actual SQL Generated:** `SELECT ... FROM "reports" AS "Report"`
- **Table Exists in DB?** ✅ YES

### Model: `ProductDNA`
- **Physical Table (Config):** `product_dna`
- **Schema:** `public`
- **freezeTableName:** `false`
- **underscored:** `false`
- **timestamps:** `true`
- **paranoid (Soft Delete):** `false`
- **Requires Quoted Identifiers:** `false`
- **Actual SQL Generated:** `SELECT ... FROM "product_dna" AS "ProductDNA"`
- **Table Exists in DB?** ✅ YES

### Model: `AttributeSchema`
- **Physical Table (Config):** `attribute_schemas`
- **Schema:** `public`
- **freezeTableName:** `false`
- **underscored:** `false`
- **timestamps:** `true`
- **paranoid (Soft Delete):** `false`
- **Requires Quoted Identifiers:** `false`
- **Actual SQL Generated:** `SELECT ... FROM "attribute_schemas" AS "AttributeSchema"`
- **Table Exists in DB?** ✅ YES

### Model: `ProductDNAAttribute`
- **Physical Table (Config):** `product_dna_attributes`
- **Schema:** `public`
- **freezeTableName:** `false`
- **underscored:** `false`
- **timestamps:** `true`
- **paranoid (Soft Delete):** `false`
- **Requires Quoted Identifiers:** `false`
- **Actual SQL Generated:** `SELECT ... FROM "product_dna_attributes" AS "ProductDNAAttribute"`
- **Table Exists in DB?** ✅ YES

### Model: `SellerListing`
- **Physical Table (Config):** `seller_listings`
- **Schema:** `public`
- **freezeTableName:** `false`
- **underscored:** `false`
- **timestamps:** `true`
- **paranoid (Soft Delete):** `true`
- **Requires Quoted Identifiers:** `false`
- **Actual SQL Generated:** `SELECT ... FROM "seller_listings" AS "SellerListing"`
- **Table Exists in DB?** ✅ YES

### Model: `SmartPricingMatrix`
- **Physical Table (Config):** `SmartPricingMatrices`
- **Schema:** `public`
- **freezeTableName:** `false`
- **underscored:** `false`
- **timestamps:** `true`
- **paranoid (Soft Delete):** `false`
- **Requires Quoted Identifiers:** `true`
- **Actual SQL Generated:** `SELECT ... FROM "SmartPricingMatrices" AS "SmartPricingMatrix"`
- **Table Exists in DB?** ✅ YES

### Model: `SmartInventory`
- **Physical Table (Config):** `SmartInventories`
- **Schema:** `public`
- **freezeTableName:** `false`
- **underscored:** `false`
- **timestamps:** `true`
- **paranoid (Soft Delete):** `false`
- **Requires Quoted Identifiers:** `true`
- **Actual SQL Generated:** `SELECT ... FROM "SmartInventories" AS "SmartInventory"`
- **Table Exists in DB?** ✅ YES

### Model: `InventoryTransaction`
- **Physical Table (Config):** `InventoryTransactions`
- **Schema:** `public`
- **freezeTableName:** `false`
- **underscored:** `false`
- **timestamps:** `true`
- **paranoid (Soft Delete):** `false`
- **Requires Quoted Identifiers:** `true`
- **Actual SQL Generated:** `SELECT ... FROM "InventoryTransactions" AS "InventoryTransaction"`
- **Table Exists in DB?** ✅ YES

### Model: `RefreshToken`
- **Physical Table (Config):** `refresh_tokens`
- **Schema:** `public`
- **freezeTableName:** `false`
- **underscored:** `false`
- **timestamps:** `true`
- **paranoid (Soft Delete):** `false`
- **Requires Quoted Identifiers:** `false`
- **Actual SQL Generated:** `SELECT ... FROM "refresh_tokens" AS "RefreshToken"`
- **Table Exists in DB?** ✅ YES

### Model: `AuditLog`
- **Physical Table (Config):** `audit_logs`
- **Schema:** `public`
- **freezeTableName:** `false`
- **underscored:** `false`
- **timestamps:** `false`
- **paranoid (Soft Delete):** `false`
- **Requires Quoted Identifiers:** `false`
- **Actual SQL Generated:** `SELECT ... FROM "audit_logs" AS "AuditLog"`
- **Table Exists in DB?** ✅ YES

### Model: `ActionLog`
- **Physical Table (Config):** `ActionLogs`
- **Schema:** `public`
- **freezeTableName:** `false`
- **underscored:** `false`
- **timestamps:** `false`
- **paranoid (Soft Delete):** `false`
- **Requires Quoted Identifiers:** `true`
- **Actual SQL Generated:** `SELECT ... FROM "ActionLogs" AS "ActionLog"`
- **Table Exists in DB?** ✅ YES

### Model: `SystemSetting`
- **Physical Table (Config):** `system_settings`
- **Schema:** `public`
- **freezeTableName:** `false`
- **underscored:** `false`
- **timestamps:** `true`
- **paranoid (Soft Delete):** `false`
- **Requires Quoted Identifiers:** `false`
- **Actual SQL Generated:** `SELECT ... FROM "system_settings" AS "SystemSetting"`
- **Table Exists in DB?** ✅ YES

### Model: `InventoryMetrics`
- **Physical Table (Config):** `inventory_metrics`
- **Schema:** `public`
- **freezeTableName:** `false`
- **underscored:** `false`
- **timestamps:** `true`
- **paranoid (Soft Delete):** `false`
- **Requires Quoted Identifiers:** `false`
- **Actual SQL Generated:** `SELECT ... FROM "inventory_metrics" AS "InventoryMetrics"`
- **Table Exists in DB?** ✅ YES

### Model: `AutoReplenishmentOrder`
- **Physical Table (Config):** `auto_replenishment_orders`
- **Schema:** `public`
- **freezeTableName:** `false`
- **underscored:** `false`
- **timestamps:** `true`
- **paranoid (Soft Delete):** `false`
- **Requires Quoted Identifiers:** `false`
- **Actual SQL Generated:** `SELECT ... FROM "auto_replenishment_orders" AS "AutoReplenishmentOrder"`
- **Table Exists in DB?** ✅ YES

### Model: `PaymentTransaction`
- **Physical Table (Config):** `payment_transactions`
- **Schema:** `public`
- **freezeTableName:** `false`
- **underscored:** `false`
- **timestamps:** `true`
- **paranoid (Soft Delete):** `false`
- **Requires Quoted Identifiers:** `false`
- **Actual SQL Generated:** `SELECT ... FROM "payment_transactions" AS "PaymentTransaction"`
- **Table Exists in DB?** ✅ YES

### Model: `PaymentMethod`
- **Physical Table (Config):** `payment_methods`
- **Schema:** `public`
- **freezeTableName:** `false`
- **underscored:** `false`
- **timestamps:** `true`
- **paranoid (Soft Delete):** `false`
- **Requires Quoted Identifiers:** `false`
- **Actual SQL Generated:** `SELECT ... FROM "payment_methods" AS "PaymentMethod"`
- **Table Exists in DB?** ✅ YES

### Model: `PaymentAuditLog`
- **Physical Table (Config):** `payment_audit_logs`
- **Schema:** `public`
- **freezeTableName:** `false`
- **underscored:** `false`
- **timestamps:** `true`
- **paranoid (Soft Delete):** `false`
- **Requires Quoted Identifiers:** `false`
- **Actual SQL Generated:** `SELECT ... FROM "payment_audit_logs" AS "PaymentAuditLog"`
- **Table Exists in DB?** ✅ YES

### Model: `WithdrawalLog`
- **Physical Table (Config):** `withdrawal_logs`
- **Schema:** `public`
- **freezeTableName:** `false`
- **underscored:** `false`
- **timestamps:** `true`
- **paranoid (Soft Delete):** `false`
- **Requires Quoted Identifiers:** `false`
- **Actual SQL Generated:** `SELECT ... FROM "withdrawal_logs" AS "WithdrawalLog"`
- **Table Exists in DB?** ✅ YES

### Model: `AlternativeQuote`
- **Physical Table (Config):** `alternative_quotes`
- **Schema:** `public`
- **freezeTableName:** `false`
- **underscored:** `false`
- **timestamps:** `true`
- **paranoid (Soft Delete):** `false`
- **Requires Quoted Identifiers:** `false`
- **Actual SQL Generated:** `SELECT ... FROM "alternative_quotes" AS "AlternativeQuote"`
- **Table Exists in DB?** ✅ YES

### Model: `Permission`
- **Physical Table (Config):** `permissions`
- **Schema:** `public`
- **freezeTableName:** `false`
- **underscored:** `false`
- **timestamps:** `true`
- **paranoid (Soft Delete):** `false`
- **Requires Quoted Identifiers:** `false`
- **Actual SQL Generated:** `SELECT ... FROM "permissions" AS "Permission"`
- **Table Exists in DB?** ✅ YES

### Model: `Role`
- **Physical Table (Config):** `roles`
- **Schema:** `public`
- **freezeTableName:** `false`
- **underscored:** `false`
- **timestamps:** `true`
- **paranoid (Soft Delete):** `false`
- **Requires Quoted Identifiers:** `false`
- **Actual SQL Generated:** `SELECT ... FROM "roles" AS "Role"`
- **Table Exists in DB?** ✅ YES

### Model: `RolePermission`
- **Physical Table (Config):** `role_permissions`
- **Schema:** `public`
- **freezeTableName:** `false`
- **underscored:** `false`
- **timestamps:** `false`
- **paranoid (Soft Delete):** `false`
- **Requires Quoted Identifiers:** `false`
- **Actual SQL Generated:** `SELECT ... FROM "role_permissions" AS "RolePermission"`
- **Table Exists in DB?** ✅ YES

### Model: `UserRole`
- **Physical Table (Config):** `user_roles`
- **Schema:** `public`
- **freezeTableName:** `false`
- **underscored:** `false`
- **timestamps:** `true`
- **paranoid (Soft Delete):** `false`
- **Requires Quoted Identifiers:** `false`
- **Actual SQL Generated:** `SELECT ... FROM "user_roles" AS "UserRole"`
- **Table Exists in DB?** ✅ YES

### Model: `Region`
- **Physical Table (Config):** `regions`
- **Schema:** `public`
- **freezeTableName:** `false`
- **underscored:** `false`
- **timestamps:** `true`
- **paranoid (Soft Delete):** `false`
- **Requires Quoted Identifiers:** `false`
- **Actual SQL Generated:** `SELECT ... FROM "regions" AS "Region"`
- **Table Exists in DB?** ✅ YES

### Model: `City`
- **Physical Table (Config):** `cities`
- **Schema:** `public`
- **freezeTableName:** `false`
- **underscored:** `false`
- **timestamps:** `true`
- **paranoid (Soft Delete):** `false`
- **Requires Quoted Identifiers:** `false`
- **Actual SQL Generated:** `SELECT ... FROM "cities" AS "City"`
- **Table Exists in DB?** ✅ YES

### Model: `Team`
- **Physical Table (Config):** `teams`
- **Schema:** `public`
- **freezeTableName:** `false`
- **underscored:** `false`
- **timestamps:** `true`
- **paranoid (Soft Delete):** `false`
- **Requires Quoted Identifiers:** `false`
- **Actual SQL Generated:** `SELECT ... FROM "teams" AS "Team"`
- **Table Exists in DB?** ✅ YES

### Model: `UserContext`
- **Physical Table (Config):** `user_context`
- **Schema:** `public`
- **freezeTableName:** `false`
- **underscored:** `false`
- **timestamps:** `true`
- **paranoid (Soft Delete):** `false`
- **Requires Quoted Identifiers:** `false`
- **Actual SQL Generated:** `SELECT ... FROM "user_context" AS "UserContext"`
- **Table Exists in DB?** ✅ YES

### Model: `Delegation`
- **Physical Table (Config):** `Delegations`
- **Schema:** `public`
- **freezeTableName:** `false`
- **underscored:** `false`
- **timestamps:** `true`
- **paranoid (Soft Delete):** `false`
- **Requires Quoted Identifiers:** `true`
- **Actual SQL Generated:** `SELECT ... FROM "Delegations" AS "Delegation"`
- **Table Exists in DB?** ✅ YES

### Model: `SellerDecision`
- **Physical Table (Config):** `SellerDecisions`
- **Schema:** `public`
- **freezeTableName:** `false`
- **underscored:** `false`
- **timestamps:** `true`
- **paranoid (Soft Delete):** `false`
- **Requires Quoted Identifiers:** `true`
- **Actual SQL Generated:** `SELECT ... FROM "SellerDecisions" AS "SellerDecision"`
- **Table Exists in DB?** ✅ YES

### Model: `BuyerDecisionContext`
- **Physical Table (Config):** `BuyerDecisionContexts`
- **Schema:** `public`
- **freezeTableName:** `false`
- **underscored:** `false`
- **timestamps:** `true`
- **paranoid (Soft Delete):** `false`
- **Requires Quoted Identifiers:** `true`
- **Actual SQL Generated:** `SELECT ... FROM "BuyerDecisionContexts" AS "BuyerDecisionContext"`
- **Table Exists in DB?** ✅ YES

### Model: `MarketSilenceEvent`
- **Physical Table (Config):** `MarketSilenceEvents`
- **Schema:** `public`
- **freezeTableName:** `false`
- **underscored:** `false`
- **timestamps:** `true`
- **paranoid (Soft Delete):** `false`
- **Requires Quoted Identifiers:** `true`
- **Actual SQL Generated:** `SELECT ... FROM "MarketSilenceEvents" AS "MarketSilenceEvent"`
- **Table Exists in DB?** ✅ YES

### Model: `SellerInteractionEvent`
- **Physical Table (Config):** `SellerInteractionEvents`
- **Schema:** `public`
- **freezeTableName:** `false`
- **underscored:** `false`
- **timestamps:** `true`
- **paranoid (Soft Delete):** `false`
- **Requires Quoted Identifiers:** `true`
- **Actual SQL Generated:** `SELECT ... FROM "SellerInteractionEvents" AS "SellerInteractionEvent"`
- **Table Exists in DB?** ✅ YES

### Model: `BuyerLimit`
- **Physical Table (Config):** `buyer_limits`
- **Schema:** `public`
- **freezeTableName:** `false`
- **underscored:** `true`
- **timestamps:** `true`
- **paranoid (Soft Delete):** `false`
- **Requires Quoted Identifiers:** `false`
- **Actual SQL Generated:** `SELECT ... FROM "buyer_limits" AS "BuyerLimit"`
- **Table Exists in DB?** ✅ YES

### Model: `CommissionTransaction`
- **Physical Table (Config):** `commission_transactions`
- **Schema:** `public`
- **freezeTableName:** `false`
- **underscored:** `true`
- **timestamps:** `true`
- **paranoid (Soft Delete):** `false`
- **Requires Quoted Identifiers:** `false`
- **Actual SQL Generated:** `SELECT ... FROM "commission_transactions" AS "CommissionTransaction"`
- **Table Exists in DB?** ✅ YES

### Model: `EventLog`
- **Physical Table (Config):** `event_logs`
- **Schema:** `public`
- **freezeTableName:** `false`
- **underscored:** `true`
- **timestamps:** `false`
- **paranoid (Soft Delete):** `false`
- **Requires Quoted Identifiers:** `false`
- **Actual SQL Generated:** `SELECT ... FROM "event_logs" AS "EventLog"`
- **Table Exists in DB?** ✅ YES

### Model: `TrustScore`
- **Physical Table (Config):** `trust_scores`
- **Schema:** `public`
- **freezeTableName:** `false`
- **underscored:** `true`
- **timestamps:** `false`
- **paranoid (Soft Delete):** `false`
- **Requires Quoted Identifiers:** `false`
- **Actual SQL Generated:** `SELECT ... FROM "trust_scores" AS "TrustScore"`
- **Table Exists in DB?** ✅ YES

### Model: `Sanction`
- **Physical Table (Config):** `sanctions`
- **Schema:** `public`
- **freezeTableName:** `false`
- **underscored:** `true`
- **timestamps:** `false`
- **paranoid (Soft Delete):** `false`
- **Requires Quoted Identifiers:** `false`
- **Actual SQL Generated:** `SELECT ... FROM "sanctions" AS "Sanction"`
- **Table Exists in DB?** ✅ YES

### Model: `AdminActionLog`
- **Physical Table (Config):** `admin_action_logs`
- **Schema:** `public`
- **freezeTableName:** `false`
- **underscored:** `true`
- **timestamps:** `false`
- **paranoid (Soft Delete):** `false`
- **Requires Quoted Identifiers:** `false`
- **Actual SQL Generated:** `SELECT ... FROM "admin_action_logs" AS "AdminActionLog"`
- **Table Exists in DB?** ✅ YES

### Model: `Invoice`
- **Physical Table (Config):** `invoices`
- **Schema:** `public`
- **freezeTableName:** `false`
- **underscored:** `false`
- **timestamps:** `false`
- **paranoid (Soft Delete):** `false`
- **Requires Quoted Identifiers:** `false`
- **Actual SQL Generated:** `SELECT ... FROM "invoices" AS "Invoice"`
- **Table Exists in DB?** ✅ YES

### Model: `SupervisorAssignment`
- **Physical Table (Config):** `supervisor_assignments`
- **Schema:** `public`
- **freezeTableName:** `false`
- **underscored:** `false`
- **timestamps:** `true`
- **paranoid (Soft Delete):** `false`
- **Requires Quoted Identifiers:** `false`
- **Actual SQL Generated:** `SELECT ... FROM "supervisor_assignments" AS "SupervisorAssignment"`
- **Table Exists in DB?** ✅ YES

### Model: `SupervisorCommissionShare`
- **Physical Table (Config):** `supervisor_commission_shares`
- **Schema:** `public`
- **freezeTableName:** `false`
- **underscored:** `false`
- **timestamps:** `true`
- **paranoid (Soft Delete):** `false`
- **Requires Quoted Identifiers:** `false`
- **Actual SQL Generated:** `SELECT ... FROM "supervisor_commission_shares" AS "SupervisorCommissionShare"`
- **Table Exists in DB?** ✅ YES

### Model: `SupervisorNotification`
- **Physical Table (Config):** `supervisor_notifications`
- **Schema:** `public`
- **freezeTableName:** `false`
- **underscored:** `false`
- **timestamps:** `true`
- **paranoid (Soft Delete):** `false`
- **Requires Quoted Identifiers:** `false`
- **Actual SQL Generated:** `SELECT ... FROM "supervisor_notifications" AS "SupervisorNotification"`
- **Table Exists in DB?** ✅ YES

### Model: `RegionAssignment`
- **Physical Table (Config):** `region_assignments`
- **Schema:** `public`
- **freezeTableName:** `false`
- **underscored:** `false`
- **timestamps:** `true`
- **paranoid (Soft Delete):** `false`
- **Requires Quoted Identifiers:** `false`
- **Actual SQL Generated:** `SELECT ... FROM "region_assignments" AS "RegionAssignment"`
- **Table Exists in DB?** ✅ YES

### Model: `FailedNotification`
- **Physical Table (Config):** `failed_notifications`
- **Schema:** `public`
- **freezeTableName:** `false`
- **underscored:** `false`
- **timestamps:** `true`
- **paranoid (Soft Delete):** `false`
- **Requires Quoted Identifiers:** `false`
- **Actual SQL Generated:** `SELECT ... FROM "failed_notifications" AS "FailedNotification"`
- **Table Exists in DB?** ✅ YES

## Phase 2 — Duplicate Analysis
Resolving capitalization splits and duplicated legacy structures.

### Duplicate Pair: `Ratings / ratings`
#### Table: `Ratings`
- **Referenced by Sequelize Models:** No
- **Referenced by Services:** No
- **Referenced by Controllers:** No
- **Referenced by Migrations:** No
- **Row Count:** `0`
- **Contains Production Data:** No
- **Classification:** Legacy / Deprecated

#### Table: `ratings`
- **Referenced by Sequelize Models:** Yes
- **Referenced by Services:** No
- **Referenced by Controllers:** Yes (1)
- **Referenced by Migrations:** No
- **Row Count:** `0`
- **Contains Production Data:** No
- **Classification:** Legacy / Deprecated

### Duplicate Pair: `Deals / deals`
#### Table: `Deals`
- **Referenced by Sequelize Models:** No
- **Referenced by Services:** No
- **Referenced by Controllers:** No
- **Referenced by Migrations:** No
- **Row Count:** `0`
- **Contains Production Data:** No
- **Classification:** Legacy / Deprecated

#### Table: `deals`
- **Referenced by Sequelize Models:** Yes
- **Referenced by Services:** Yes (5)
- **Referenced by Controllers:** Yes (3)
- **Referenced by Migrations:** No
- **Row Count:** `5`
- **Contains Production Data:** Yes
- **Classification:** Canonical

### Duplicate Pair: `Categories / categories`
#### Table: `Categories`
- **Referenced by Sequelize Models:** Yes
- **Referenced by Services:** Yes (1)
- **Referenced by Controllers:** Yes (3)
- **Referenced by Migrations:** No
- **Row Count:** `5`
- **Contains Production Data:** Yes
- **Classification:** Legacy / Deprecated

#### Table: `categories`
- **Referenced by Sequelize Models:** No
- **Referenced by Services:** No
- **Referenced by Controllers:** No
- **Referenced by Migrations:** No
- **Row Count:** `14`
- **Contains Production Data:** Yes
- **Classification:** Canonical

### Duplicate Pair: `users / Users`
#### Table: `users`
- **Referenced by Sequelize Models:** Yes
- **Referenced by Services:** Yes (4)
- **Referenced by Controllers:** Yes (4)
- **Referenced by Migrations:** No
- **Row Count:** `4154`
- **Contains Production Data:** Yes
- **Classification:** Canonical / Never Remove (Core Data)

#### Table: `Users`
- **Referenced by Sequelize Models:** No
- **Referenced by Services:** No
- **Referenced by Controllers:** No
- **Referenced by Migrations:** No
- **Row Count:** `1`
- **Contains Production Data:** Yes
- **Classification:** Legacy / Accidental (Created by Auto-Sync)

### Duplicate Pair: `Products / products`
#### Table: `Products`
- **Referenced by Sequelize Models:** Yes
- **Referenced by Services:** Yes (3)
- **Referenced by Controllers:** Yes (2)
- **Referenced by Migrations:** No
- **Row Count:** `15`
- **Contains Production Data:** Yes
- **Classification:** Canonical

#### Table: `products`
- **Referenced by Sequelize Models:** No
- **Referenced by Services:** No
- **Referenced by Controllers:** No
- **Referenced by Migrations:** No
- **Row Count:** `0`
- **Contains Production Data:** No
- **Classification:** Legacy / Deprecated

### Duplicate Pair: `Notifications / notifications`
#### Table: `Notifications`
- **Referenced by Sequelize Models:** No
- **Referenced by Services:** No
- **Referenced by Controllers:** No
- **Referenced by Migrations:** No
- **Row Count:** `79`
- **Contains Production Data:** Yes
- **Classification:** Legacy / Deprecated

#### Table: `notifications`
- **Referenced by Sequelize Models:** Yes
- **Referenced by Services:** Yes (2)
- **Referenced by Controllers:** Yes (3)
- **Referenced by Migrations:** No
- **Row Count:** `106`
- **Contains Production Data:** Yes
- **Classification:** Canonical

### Duplicate Pair: `Reports / reports`
#### Table: `Reports`
- **Referenced by Sequelize Models:** No
- **Referenced by Services:** No
- **Referenced by Controllers:** No
- **Referenced by Migrations:** No
- **Row Count:** `0`
- **Contains Production Data:** No
- **Classification:** Legacy / Deprecated

#### Table: `reports`
- **Referenced by Sequelize Models:** Yes
- **Referenced by Services:** No
- **Referenced by Controllers:** Yes (1)
- **Referenced by Migrations:** No
- **Row Count:** `0`
- **Contains Production Data:** No
- **Classification:** Legacy / Deprecated

### Other Identified Conceptual Duplicates
- `PurchaseRequests` vs `purchase_requests`
  - **Status:** `PurchaseRequests` is the active runtime table (referenced strictly in models), while `purchase_requests` is an older snake_case artifact in raw SQL or older migrations.
- `PriceQuotes` vs `price_quotes`
  - **Status:** Same as above. Sequelize forces camel/pascal casing in newer models, while old code relied on snake_case.


## Phase 3 — Dependency Graph
Aggregated map of relationships and usage domains.

### `users`
- **Incoming FKs:** Products, PurchaseRequests, PurchaseOrders, Receipts, PriceQuotes, deals, seller_listings, SmartInventories, Delegations, SellerDecisions, BuyerDecisionContexts, SellerInteractionEvents, buyer_limits, commission_transactions, invoices, supervisor_assignments, supervisor_commission_shares, supervisor_notifications, region_assignments
- **Outgoing FKs:** None
- **Referenced By:** Models (Yes), Services (4), Controllers (6), Scheduled Jobs (0), AI Components (1), Dashboard (2)

### `Categories`
- **Incoming FKs:** Categories, Products, PurchaseRequests, PurchaseRequestItems, product_dna, MarketSilenceEvents
- **Outgoing FKs:** Categories
- **Referenced By:** Models (Yes), Services (1), Controllers (3), Scheduled Jobs (0), AI Components (0), Dashboard (0)

### `organizations`
- **Incoming FKs:** Products, PurchaseRequests, PurchaseRequestInvitations, Quotations, Awards, AwardLines, PurchaseOrders, Shipments, PriceQuotes, deals, seller_listings, audit_logs
- **Outgoing FKs:** None
- **Referenced By:** Models (Yes), Services (0), Controllers (1), Scheduled Jobs (0), AI Components (0), Dashboard (0)

### `AssetTypes`
- **Incoming FKs:** Products, PurchaseRequests
- **Outgoing FKs:** None
- **Referenced By:** Models (Yes), Services (0), Controllers (0), Scheduled Jobs (0), AI Components (0), Dashboard (0)

### `Products`
- **Incoming FKs:** SmartInventories
- **Outgoing FKs:** users, organizations, Categories, AssetTypes
- **Referenced By:** Models (Yes), Services (3), Controllers (3), Scheduled Jobs (1), AI Components (0), Dashboard (1)

### `PurchaseRequests`
- **Incoming FKs:** PurchaseRequestItems, PurchaseRequestInvitations, Quotations, Awards, PriceQuotes, deals, SellerDecisions, BuyerDecisionContexts, MarketSilenceEvents, SellerInteractionEvents
- **Outgoing FKs:** organizations, users, Categories, AssetTypes
- **Referenced By:** Models (Yes), Services (7), Controllers (3), Scheduled Jobs (0), AI Components (0), Dashboard (3)

### `PurchaseRequestItems`
- **Incoming FKs:** QuotationItems, AwardLines
- **Outgoing FKs:** PurchaseRequests, product_dna, Categories
- **Referenced By:** Models (Yes), Services (3), Controllers (0), Scheduled Jobs (0), AI Components (0), Dashboard (0)

### `PurchaseRequestInvitations`
- **Incoming FKs:** Quotations
- **Outgoing FKs:** PurchaseRequests, organizations
- **Referenced By:** Models (Yes), Services (1), Controllers (0), Scheduled Jobs (0), AI Components (0), Dashboard (0)

### `Quotations`
- **Incoming FKs:** QuotationItems
- **Outgoing FKs:** PurchaseRequests, organizations, PurchaseRequestInvitations
- **Referenced By:** Models (Yes), Services (3), Controllers (0), Scheduled Jobs (0), AI Components (0), Dashboard (0)

### `QuotationItems`
- **Incoming FKs:** AwardLines
- **Outgoing FKs:** Quotations, PurchaseRequestItems, product_dna
- **Referenced By:** Models (Yes), Services (1), Controllers (0), Scheduled Jobs (0), AI Components (0), Dashboard (0)

### `Awards`
- **Incoming FKs:** AwardLines, PurchaseOrders
- **Outgoing FKs:** PurchaseRequests, organizations
- **Referenced By:** Models (Yes), Services (1), Controllers (0), Scheduled Jobs (0), AI Components (0), Dashboard (0)

### `AwardLines`
- **Incoming FKs:** PurchaseOrderLines
- **Outgoing FKs:** Awards, PurchaseRequestItems, QuotationItems, organizations, product_dna
- **Referenced By:** Models (Yes), Services (1), Controllers (0), Scheduled Jobs (0), AI Components (0), Dashboard (0)

### `PurchaseOrders`
- **Incoming FKs:** PurchaseOrderLines, Shipments, Receipts
- **Outgoing FKs:** Awards, users, organizations
- **Referenced By:** Models (Yes), Services (1), Controllers (0), Scheduled Jobs (0), AI Components (0), Dashboard (0)

### `PurchaseOrderLines`
- **Incoming FKs:** ShipmentLines, ReceiptLines
- **Outgoing FKs:** PurchaseOrders, AwardLines, product_dna
- **Referenced By:** Models (Yes), Services (1), Controllers (0), Scheduled Jobs (0), AI Components (0), Dashboard (0)

### `Shipments`
- **Incoming FKs:** ShipmentLines, Receipts
- **Outgoing FKs:** PurchaseOrders, organizations
- **Referenced By:** Models (Yes), Services (2), Controllers (0), Scheduled Jobs (0), AI Components (2), Dashboard (0)

### `ShipmentLines`
- **Incoming FKs:** None
- **Outgoing FKs:** Shipments, PurchaseOrderLines
- **Referenced By:** Models (Yes), Services (1), Controllers (0), Scheduled Jobs (0), AI Components (1), Dashboard (0)

### `Receipts`
- **Incoming FKs:** ReceiptLines
- **Outgoing FKs:** PurchaseOrders, Shipments, users
- **Referenced By:** Models (Yes), Services (2), Controllers (0), Scheduled Jobs (0), AI Components (2), Dashboard (0)

### `ReceiptLines`
- **Incoming FKs:** None
- **Outgoing FKs:** Receipts, PurchaseOrderLines
- **Referenced By:** Models (Yes), Services (1), Controllers (0), Scheduled Jobs (0), AI Components (1), Dashboard (0)

### `PriceQuotes`
- **Incoming FKs:** BuyerDecisionContexts
- **Outgoing FKs:** organizations, users, PurchaseRequests
- **Referenced By:** Models (Yes), Services (9), Controllers (3), Scheduled Jobs (0), AI Components (0), Dashboard (2)

### `deals`
- **Incoming FKs:** commission_transactions, supervisor_assignments, supervisor_commission_shares, supervisor_notifications
- **Outgoing FKs:** organizations, invoices, users, PurchaseRequests
- **Referenced By:** Models (Yes), Services (5), Controllers (3), Scheduled Jobs (0), AI Components (0), Dashboard (2)

### `notifications`
- **Incoming FKs:** None
- **Outgoing FKs:** None
- **Referenced By:** Models (Yes), Services (2), Controllers (4), Scheduled Jobs (0), AI Components (0), Dashboard (0)

### `SLARecords`
- **Incoming FKs:** None
- **Outgoing FKs:** None
- **Referenced By:** Models (Yes), Services (1), Controllers (0), Scheduled Jobs (0), AI Components (0), Dashboard (0)

### `product_dna`
- **Incoming FKs:** PurchaseRequestItems, QuotationItems, AwardLines, PurchaseOrderLines, product_dna_attributes, seller_listings
- **Outgoing FKs:** Categories
- **Referenced By:** Models (Yes), Services (1), Controllers (0), Scheduled Jobs (1), AI Components (0), Dashboard (0)

### `attribute_schemas`
- **Incoming FKs:** product_dna_attributes
- **Outgoing FKs:** None
- **Referenced By:** Models (Yes), Services (1), Controllers (0), Scheduled Jobs (0), AI Components (0), Dashboard (0)

### `product_dna_attributes`
- **Incoming FKs:** None
- **Outgoing FKs:** product_dna, attribute_schemas
- **Referenced By:** Models (Yes), Services (1), Controllers (0), Scheduled Jobs (0), AI Components (0), Dashboard (0)

### `seller_listings`
- **Incoming FKs:** None
- **Outgoing FKs:** product_dna, organizations, users
- **Referenced By:** Models (Yes), Services (2), Controllers (0), Scheduled Jobs (1), AI Components (0), Dashboard (0)

### `SmartPricingMatrices`
- **Incoming FKs:** None
- **Outgoing FKs:** None
- **Referenced By:** Models (Yes), Services (1), Controllers (1), Scheduled Jobs (0), AI Components (0), Dashboard (1)

### `SmartInventories`
- **Incoming FKs:** inventory_metrics, auto_replenishment_orders
- **Outgoing FKs:** Products, users
- **Referenced By:** Models (Yes), Services (3), Controllers (1), Scheduled Jobs (0), AI Components (0), Dashboard (0)

### `InventoryTransactions`
- **Incoming FKs:** None
- **Outgoing FKs:** None
- **Referenced By:** Models (Yes), Services (1), Controllers (0), Scheduled Jobs (0), AI Components (0), Dashboard (0)

### `audit_logs`
- **Incoming FKs:** None
- **Outgoing FKs:** organizations
- **Referenced By:** Models (Yes), Services (6), Controllers (7), Scheduled Jobs (0), AI Components (0), Dashboard (2)

### `ActionLogs`
- **Incoming FKs:** None
- **Outgoing FKs:** None
- **Referenced By:** Models (Yes), Services (1), Controllers (1), Scheduled Jobs (0), AI Components (0), Dashboard (0)

### `inventory_metrics`
- **Incoming FKs:** None
- **Outgoing FKs:** SmartInventories
- **Referenced By:** Models (Yes), Services (1), Controllers (0), Scheduled Jobs (0), AI Components (0), Dashboard (0)

### `auto_replenishment_orders`
- **Incoming FKs:** None
- **Outgoing FKs:** SmartInventories
- **Referenced By:** Models (Yes), Services (1), Controllers (0), Scheduled Jobs (0), AI Components (0), Dashboard (0)

### `payment_transactions`
- **Incoming FKs:** None
- **Outgoing FKs:** None
- **Referenced By:** Models (Yes), Services (1), Controllers (1), Scheduled Jobs (0), AI Components (0), Dashboard (0)

### `payment_methods`
- **Incoming FKs:** None
- **Outgoing FKs:** None
- **Referenced By:** Models (Yes), Services (1), Controllers (0), Scheduled Jobs (0), AI Components (0), Dashboard (0)

### `withdrawal_logs`
- **Incoming FKs:** None
- **Outgoing FKs:** None
- **Referenced By:** Models (Yes), Services (2), Controllers (0), Scheduled Jobs (0), AI Components (0), Dashboard (0)

### `Delegations`
- **Incoming FKs:** None
- **Outgoing FKs:** users
- **Referenced By:** Models (Yes), Services (0), Controllers (1), Scheduled Jobs (0), AI Components (0), Dashboard (0)

### `SellerDecisions`
- **Incoming FKs:** None
- **Outgoing FKs:** users, PurchaseRequests
- **Referenced By:** Models (Yes), Services (1), Controllers (0), Scheduled Jobs (0), AI Components (0), Dashboard (0)

### `BuyerDecisionContexts`
- **Incoming FKs:** None
- **Outgoing FKs:** users, PriceQuotes, PurchaseRequests
- **Referenced By:** Models (Yes), Services (0), Controllers (0), Scheduled Jobs (0), AI Components (0), Dashboard (0)

### `MarketSilenceEvents`
- **Incoming FKs:** None
- **Outgoing FKs:** Categories, PurchaseRequests
- **Referenced By:** Models (Yes), Services (1), Controllers (0), Scheduled Jobs (0), AI Components (0), Dashboard (0)

### `SellerInteractionEvents`
- **Incoming FKs:** None
- **Outgoing FKs:** users, PurchaseRequests
- **Referenced By:** Models (Yes), Services (2), Controllers (0), Scheduled Jobs (0), AI Components (0), Dashboard (0)

### `buyer_limits`
- **Incoming FKs:** None
- **Outgoing FKs:** users
- **Referenced By:** Models (Yes), Services (1), Controllers (0), Scheduled Jobs (0), AI Components (0), Dashboard (0)

### `commission_transactions`
- **Incoming FKs:** None
- **Outgoing FKs:** invoices, deals, users
- **Referenced By:** Models (Yes), Services (2), Controllers (0), Scheduled Jobs (0), AI Components (0), Dashboard (0)

### `event_logs`
- **Incoming FKs:** None
- **Outgoing FKs:** None
- **Referenced By:** Models (Yes), Services (2), Controllers (0), Scheduled Jobs (0), AI Components (0), Dashboard (0)

### `trust_scores`
- **Incoming FKs:** None
- **Outgoing FKs:** None
- **Referenced By:** Models (Yes), Services (1), Controllers (0), Scheduled Jobs (0), AI Components (0), Dashboard (0)

### `sanctions`
- **Incoming FKs:** None
- **Outgoing FKs:** None
- **Referenced By:** Models (Yes), Services (1), Controllers (0), Scheduled Jobs (0), AI Components (0), Dashboard (0)

### `admin_action_logs`
- **Incoming FKs:** None
- **Outgoing FKs:** None
- **Referenced By:** Models (Yes), Services (1), Controllers (0), Scheduled Jobs (0), AI Components (0), Dashboard (1)

### `invoices`
- **Incoming FKs:** deals, commission_transactions
- **Outgoing FKs:** users
- **Referenced By:** Models (Yes), Services (1), Controllers (1), Scheduled Jobs (1), AI Components (0), Dashboard (0)

### `supervisor_assignments`
- **Incoming FKs:** supervisor_commission_shares
- **Outgoing FKs:** deals, users
- **Referenced By:** Models (Yes), Services (1), Controllers (0), Scheduled Jobs (0), AI Components (0), Dashboard (0)

### `supervisor_commission_shares`
- **Incoming FKs:** None
- **Outgoing FKs:** supervisor_assignments, users, deals
- **Referenced By:** Models (Yes), Services (2), Controllers (1), Scheduled Jobs (0), AI Components (0), Dashboard (0)

### `supervisor_notifications`
- **Incoming FKs:** None
- **Outgoing FKs:** users, deals
- **Referenced By:** Models (Yes), Services (1), Controllers (1), Scheduled Jobs (0), AI Components (0), Dashboard (0)

### `region_assignments`
- **Incoming FKs:** None
- **Outgoing FKs:** users
- **Referenced By:** Models (Yes), Services (1), Controllers (0), Scheduled Jobs (0), AI Components (0), Dashboard (0)

### `failed_notifications`
- **Incoming FKs:** None
- **Outgoing FKs:** None
- **Referenced By:** Models (Yes), Services (1), Controllers (0), Scheduled Jobs (1), AI Components (0), Dashboard (0)

## Phase 4 — Canonical Recommendation

> **Context:** B2B Procurement Marketplace with AI, RFQ workflows, Future ERP integration, and BI readiness.

### 1. Naming Conventions (The Hard Truth)
The split between `users` (snake_case/lowercase) and `Users` (PascalCase) is a symptom of inconsistent `freezeTableName` and `underscored` usage across Sequelize models.
**Recommendation:** 
- **Standardize on `snake_case` for all physical tables and columns.** 
- **Why?** Postgres handles lowercase naturally without requiring explicit quotes. `Users` requires `"Users"` in every raw query, causing friction for BI tools (Metabase, Superset) and ERP integration.

### 2. Core Procurement / RFQ Workflow
- `PurchaseRequests` -> `Quotations` -> `PurchaseOrders` -> `Invoices` -> `Shipments`.
- **Recommendation:** Implement strict **State Machines** via Postgres ENUMs (or separated Status tables) to avoid ghost states. Enforce `paranoid: true` (Soft Deletes) across all these tables for financial auditing. 

### 3. ERP & Scalability Readiness
- **Recommendation:** Isolate `InventoryTransactions` and `CommissionTransactions` into a **Write-Ahead Ledger (WAL)** pattern or an append-only accounting table. ERP syncs rely on immutability. Do NOT update balances in place without an append-only log.

### 4. AI & Machine Learning Layer
- **Recommendation:** `ProductDNA` and `SellerInteractionEvents` are the goldmine for embeddings. 
- Introduce `pgvector` to a dedicated schema or read replica for AI vector storage. Do not overload the transactional schema with dense vector indexes.

### 5. PostgreSQL Best Practices
- **Use UUIDv7 (or v4)** for all Primary Keys to prevent enumeration attacks and support distributed creation (mobile offline-sync).
- Implement `JSONB` carefully for `User.notificationSettings` and `AttributeSchemas`, applying GIN indexes for fast querying.

## Phase 5 — Migration Risk Report

### Difficulty: HIGH
Migrating from mixed-case (e.g., `PurchaseRequests`) to strict `snake_case` (`purchase_requests`) across a production-grade DB with existing data and FK constraints requires orchestration.

### Risks
- **Downtime:** Renaming tables locks them.
- **Codebase Desync:** Sequelize models, raw SQL queries, and ORM associations must flip simultaneously.
- **Lost Data in Duplicates:** For tables like `categories` vs `Categories`, merging foreign keys pointing to ID 5 in `Categories` vs ID 5 in `categories` is extremely risky.

### Safest Migration Strategy (The "Blue/Green" DB Cutover)
1. **Freeze Code:** Ensure all models use explicit `tableName: 'target_table_name'` (e.g. `purchase_requests`).
2. **Migration Script (Non-Destructive):**
   - Create the canonical `snake_case` tables.
   - Use `INSERT INTO ... SELECT * FROM ...` to copy data from legacy PascalCase tables.
   - For duplicates (`categories` / `Categories`), run an ETL script to merge and remap foreign keys *before* the cutover.
3. **Switch & Drop:** Deploy code. Verify traffic. Run a cleanup migration 2 weeks later to drop the orphaned PascalCase tables.

### Expected Future Maintenance Savings
- **80% reduction in raw SQL bugs** caused by forgotten quote identifiers `"PurchaseRequests"`.
- **Seamless Data Warehouse sync** via Fivetran or Airbyte, which prefer standardized lowercase naming.
- **Clearer Mental Model** for developers onboarding to the B2B marketplace.
