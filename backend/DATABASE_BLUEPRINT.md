# 🏛️ FORENSIC DATABASE BLUEPRINT & ARCHITECTURE TRUTH MAP
> This is a definitive, zero-modification forensic architecture verification report. Generated automatically.

## 1. Sequelize Models Map
This section details every parsed Sequelize model, physical table, relations, and usage.

### `User`
- **Physical Table:** `users`
- **Explicit tableName:** `users`
- **Usage (Runtime Code):** Used in 10 files
  - `/controllers/adminController.js`
  - `/controllers/authController.js`
  - `/controllers/dashboardController.js`
  - `/controllers/ownerController.js`
  - `/services/emailService.js`
  - `/services/requestService.js`
  - `/services/SupplierQualificationService.js`
  - `/services/userService.js`
  - `/routes/agentRoutes.js`
  - `/routes/ownerRoutes.js`
- **Associations:**
  - [BelongsToMany] `Role` (FK: `userId`)
  - [BelongsToMany] `Organization` (FK: `user_id`)
  - [HasMany] `Delegation` (FK: `fromUserId`)
  - [HasMany] `Delegation` (FK: `toUserId`)
  - [BelongsToMany] `Category` (FK: `userId`)
  - [HasMany] `PurchaseRequest` (FK: `userId`)
  - [HasMany] `Product` (FK: `sellerId`)
  - [HasMany] `Notification` (FK: `userId`)
  - [HasMany] `Invoice` (FK: `buyer_id`)
  - [HasMany] `Invoice` (FK: `seller_id`)
  - [HasMany] `EventLog` (FK: `actorId`)
  - [HasMany] `SellerListing` (FK: `createdByUserId`)
  - [HasMany] `SellerDecision` (FK: `userId`)
  - [HasMany] `BuyerDecisionContext` (FK: `buyerId`)
  - [HasMany] `SellerInteractionEvent` (FK: `sellerId`)
  - [HasOne] `BuyerLimit` (FK: `buyerId`)
  - [HasMany] `SupervisorAssignment` (FK: `supervisor_id`)
  - [HasMany] `SupervisorNotification` (FK: `supervisor_id`)
- **Hooks:** beforeUpdate, beforeCreate, beforeSave

### `Category`
- **Physical Table:** `Categories`
- **Explicit tableName:** `Categories`
- **Usage (Runtime Code):** Used in 4 files
  - `/controllers/authController.js`
  - `/controllers/categoryController.js`
  - `/controllers/requestController.js`
  - `/services/requestService.js`
- **Associations:**
  - [HasMany] `Category` (FK: `parentId`)
  - [BelongsTo] `Category` (FK: `parentId`)
  - [BelongsToMany] `User` (FK: `categoryId`)
  - [HasMany] `ProductDNA` (FK: `categoryId`)
  - [HasMany] `Product` (FK: `categoryId`)
  - [HasMany] `PurchaseRequest` (FK: `categoryId`)

### `UserCategory`
- **Physical Table:** `UserCategories`
- **Explicit tableName:** `UserCategories`
- **Usage (Runtime Code):** ⚠️ NO DIRECT RUNTIME USAGE DETECTED (Possibly ORPHAN)
- **Associations:** None
- **Indexes:**
  - `user_categories_user_id_category_id` on fields: userId, categoryId
- **Hooks:** beforeCreate

### `Organization`
- **Physical Table:** `organizations`
- **Explicit tableName:** `organizations`
- **Usage (Runtime Code):** Used in 1 files
  - `/controllers/authController.js`
- **Associations:**
  - [BelongsToMany] `User` (FK: `organization_id`)
  - [HasMany] `PurchaseRequest` (FK: `organization_id`)
  - [HasMany] `PriceQuote` (FK: `organization_id`)
  - [HasMany] `Deal` (FK: `organization_id`)
  - [HasMany] `AuditLog` (FK: `organization_id`)
  - [HasMany] `SellerListing` (FK: `organizationId`)
  - [HasMany] `Award` (FK: `sellerOrganizationId`)

### `OrganizationUser`
- **Physical Table:** `organization_users`
- **Explicit tableName:** `organization_users`
- **Usage (Runtime Code):** Used in 1 files
  - `/controllers/authController.js`
- **Associations:** None

### `AssetType`
- **Physical Table:** `AssetTypes`
- **Explicit tableName:** `Implicit`
- **Usage (Runtime Code):** ⚠️ NO DIRECT RUNTIME USAGE DETECTED (Possibly ORPHAN)
- **Associations:**
  - [HasMany] `Product` (FK: `assetTypeId`)
  - [HasMany] `PurchaseRequest` (FK: `assetTypeId`)
- **Indexes:**
  - `asset_types_code` on fields: code
  - `asset_types_is_active` on fields: isActive

### `Product`
- **Physical Table:** `Products`
- **Explicit tableName:** `Implicit`
- **Usage (Runtime Code):** Used in 7 files
  - `/controllers/dashboardController.js`
  - `/controllers/productController.js`
  - `/services/CatalogWriteFacade.js`
  - `/services/inventory/InventoryService.js`
  - `/services/inventoryEngine.js`
  - `/routes/agentRoutes.js`
  - `/jobs/CatalogMigrationWorker.js`
- **Associations:**
  - [BelongsTo] `User` (FK: `sellerId`)
  - [BelongsTo] `Organization` (FK: `ownerOrganizationId`)
  - [BelongsTo] `Category` (FK: `categoryId`)
  - [BelongsTo] `AssetType` (FK: `assetTypeId`)
  - [HasOne] `SmartInventory` (FK: `productId`)
- **Indexes:**
  - `products_product_tier` on fields: productTier
  - `products_stock_level` on fields: stockLevel

### `PurchaseRequest`
- **Physical Table:** `PurchaseRequests`
- **Explicit tableName:** `Implicit`
- **Usage (Runtime Code):** Used in 10 files
  - `/controllers/commandDashboardController.js`
  - `/controllers/dashboardController.js`
  - `/controllers/ownerController.js`
  - `/services/dashboardService.js`
  - `/services/limitService.js`
  - `/services/marketMonitoringService.js`
  - `/services/notificationPolicyService.js`
  - `/services/requestService.js`
  - `/services/trustScoreService.js`
  - `/services/userService.js`
- **Associations:**
  - [BelongsTo] `Organization` (FK: `organization_id`)
  - [BelongsTo] `User` (FK: `userId`)
  - [BelongsTo] `Category` (FK: `categoryId`)
  - [BelongsTo] `AssetType` (FK: `assetTypeId`)
  - [HasMany] `PriceQuote` (FK: `purchaseRequestId`)
  - [HasOne] `Deal` (FK: `purchaseRequestId`)
  - [HasMany] `PurchaseRequestItem` (FK: `purchaseRequestId`)
  - [HasMany] `PurchaseRequestInvitation` (FK: `purchaseRequestId`)
  - [HasMany] `Quotation` (FK: `purchaseRequestId`)
  - [HasMany] `Award` (FK: `purchaseRequestId`)

### `PurchaseRequestItem`
- **Physical Table:** `PurchaseRequestItems`
- **Explicit tableName:** `Implicit`
- **Usage (Runtime Code):** Used in 3 files
  - `/services/awardService.js`
  - `/services/quotationService.js`
  - `/services/requestService.js`
- **Associations:**
  - [BelongsTo] `PurchaseRequest` (FK: `purchaseRequestId`)
  - [BelongsTo] `ProductDNA` (FK: `productDNAId`)
  - [BelongsTo] `Category` (FK: `categoryId`)
  - [HasMany] `AwardLine` (FK: `purchaseRequestItemId`)

### `PurchaseRequestInvitation`
- **Physical Table:** `PurchaseRequestInvitations`
- **Explicit tableName:** `Implicit`
- **Usage (Runtime Code):** Used in 1 files
  - `/services/requestService.js`
- **Associations:**
  - [BelongsTo] `PurchaseRequest` (FK: `purchaseRequestId`)
  - [BelongsTo] `Organization` (FK: `sellerOrganizationId`)

### `Quotation`
- **Physical Table:** `Quotations`
- **Explicit tableName:** `Implicit`
- **Usage (Runtime Code):** Used in 3 files
  - `/services/awardService.js`
  - `/services/quotationService.js`
  - `/services/requestService.js`
- **Associations:**
  - [BelongsTo] `PurchaseRequest` (FK: `purchaseRequestId`)
  - [BelongsTo] `Organization` (FK: `sellerOrganizationId`)
  - [BelongsTo] `PurchaseRequestInvitation` (FK: `invitationId`)
  - [HasMany] `QuotationItem` (FK: `quotationId`)

### `QuotationItem`
- **Physical Table:** `QuotationItems`
- **Explicit tableName:** `Implicit`
- **Usage (Runtime Code):** Used in 1 files
  - `/services/quotationService.js`
- **Associations:**
  - [BelongsTo] `Quotation` (FK: `quotationId`)
  - [BelongsTo] `PurchaseRequestItem` (FK: `purchaseRequestItemId`)
  - [BelongsTo] `ProductDNA` (FK: `productDNAId`)
  - [HasMany] `AwardLine` (FK: `quotationItemId`)

### `Award`
- **Physical Table:** `Awards`
- **Explicit tableName:** `Implicit`
- **Usage (Runtime Code):** Used in 1 files
  - `/services/awardService.js`
- **Associations:**
  - [BelongsTo] `PurchaseRequest` (FK: `purchaseRequestId`)
  - [BelongsTo] `Organization` (FK: `sellerOrganizationId`)
  - [HasMany] `AwardLine` (FK: `awardId`)
  - [HasOne] `PurchaseOrder` (FK: `awardId`)
- **Indexes:**
  - `awards_purchase_request_id` on fields: purchaseRequestId
  - `awards_seller_organization_id` on fields: sellerOrganizationId
  - `awards_status` on fields: status

### `AwardLine`
- **Physical Table:** `AwardLines`
- **Explicit tableName:** `Implicit`
- **Usage (Runtime Code):** Used in 1 files
  - `/services/awardService.js`
- **Associations:**
  - [BelongsTo] `Award` (FK: `awardId`)
  - [BelongsTo] `PurchaseRequestItem` (FK: `purchaseRequestItemId`)
  - [BelongsTo] `QuotationItem` (FK: `quotationItemId`)
  - [BelongsTo] `Organization` (FK: `sellerOrganizationId`)
  - [BelongsTo] `ProductDNA` (FK: `productDNAId`)
  - [HasOne] `PurchaseOrderLine` (FK: `awardLineId`)
- **Indexes:**
  - `award_lines_award_id` on fields: awardId
  - `award_lines_purchase_request_item_id` on fields: purchaseRequestItemId

### `PurchaseOrder`
- **Physical Table:** `PurchaseOrders`
- **Explicit tableName:** `Implicit`
- **Usage (Runtime Code):** Used in 1 files
  - `/services/procurementService.js`
- **Associations:**
  - [BelongsTo] `Award` (FK: `awardId`)
  - [BelongsTo] `User` (FK: `buyerId`)
  - [BelongsTo] `Organization` (FK: `sellerOrganizationId`)
  - [HasMany] `PurchaseOrderLine` (FK: `purchaseOrderId`)
  - [HasMany] `Shipment` (FK: `purchaseOrderId`)
  - [HasMany] `Receipt` (FK: `purchaseOrderId`)
- **Indexes:**
  - `purchase_orders_purchase_order_number` on fields: purchaseOrderNumber
  - `purchase_orders_award_id` on fields: awardId
  - `purchase_orders_buyer_id` on fields: buyerId
  - `purchase_orders_seller_organization_id` on fields: sellerOrganizationId
  - `purchase_orders_business_status` on fields: businessStatus
  - `purchase_orders_fulfillment_status` on fields: fulfillmentStatus

### `PurchaseOrderLine`
- **Physical Table:** `PurchaseOrderLines`
- **Explicit tableName:** `Implicit`
- **Usage (Runtime Code):** Used in 1 files
  - `/services/procurementService.js`
- **Associations:**
  - [BelongsTo] `PurchaseOrder` (FK: `purchaseOrderId`)
  - [BelongsTo] `AwardLine` (FK: `awardLineId`)
  - [BelongsTo] `ProductDNA` (FK: `productDNAId`)
- **Indexes:**
  - `purchase_order_lines_purchase_order_id` on fields: purchaseOrderId
  - `purchase_order_lines_award_line_id` on fields: awardLineId

### `Shipment`
- **Physical Table:** `Shipments`
- **Explicit tableName:** `Implicit`
- **Usage (Runtime Code):** Used in 2 files
  - `/services/fulfillment/ShipmentModule.js`
  - `/services/fulfillment/StateProjectionModule.js`
- **Associations:**
  - [BelongsTo] `PurchaseOrder` (FK: `purchaseOrderId`)
  - [BelongsTo] `Organization` (FK: `sellerOrganizationId`)
  - [HasMany] `ShipmentLine` (FK: `shipmentId`)
  - [HasMany] `Receipt` (FK: `shipmentId`)
- **Indexes:**
  - `shipments_purchase_order_id` on fields: purchaseOrderId
  - `shipments_seller_organization_id` on fields: sellerOrganizationId
  - `shipments_status` on fields: status

### `ShipmentLine`
- **Physical Table:** `ShipmentLines`
- **Explicit tableName:** `Implicit`
- **Usage (Runtime Code):** Used in 1 files
  - `/services/fulfillment/ShipmentModule.js`
- **Associations:**
  - [BelongsTo] `Shipment` (FK: `shipmentId`)
  - [BelongsTo] `PurchaseOrderLine` (FK: `purchaseOrderLineId`)
- **Indexes:**
  - `shipment_lines_shipment_id` on fields: shipmentId
  - `shipment_lines_purchase_order_line_id` on fields: purchaseOrderLineId

### `Receipt`
- **Physical Table:** `Receipts`
- **Explicit tableName:** `Implicit`
- **Usage (Runtime Code):** Used in 2 files
  - `/services/fulfillment/ReceiptModule.js`
  - `/services/fulfillment/StateProjectionModule.js`
- **Associations:**
  - [BelongsTo] `PurchaseOrder` (FK: `purchaseOrderId`)
  - [BelongsTo] `Shipment` (FK: `shipmentId`)
  - [BelongsTo] `User` (FK: `buyerId`)
  - [HasMany] `ReceiptLine` (FK: `receiptId`)
- **Indexes:**
  - `receipts_purchase_order_id` on fields: purchaseOrderId
  - `receipts_shipment_id` on fields: shipmentId
  - `receipts_buyer_id` on fields: buyerId
  - `receipts_status` on fields: status

### `ReceiptLine`
- **Physical Table:** `ReceiptLines`
- **Explicit tableName:** `Implicit`
- **Usage (Runtime Code):** Used in 1 files
  - `/services/fulfillment/ReceiptModule.js`
- **Associations:**
  - [BelongsTo] `Receipt` (FK: `receiptId`)
  - [BelongsTo] `PurchaseOrderLine` (FK: `purchaseOrderLineId`)
- **Indexes:**
  - `receipt_lines_receipt_id` on fields: receiptId
  - `receipt_lines_purchase_order_line_id` on fields: purchaseOrderLineId

### `PriceQuote`
- **Physical Table:** `PriceQuotes`
- **Explicit tableName:** `Implicit`
- **Usage (Runtime Code):** Used in 13 files
  - `/controllers/dashboardController.js`
  - `/controllers/ownerController.js`
  - `/services/AutoNegotiationService.js`
  - `/services/AutoReplenishmentService.js`
  - `/services/dashboardService.js`
  - `/services/priceRadarService.js`
  - `/services/pricingEngine.js`
  - `/services/quoteService.js`
  - `/services/requestService.js`
  - `/services/SupplierQualificationService.js`
  - `/services/userService.js`
  - `/routes/chatRoutes.js`
  - `/middleware/attachmentProtection.js`
- **Associations:**
  - [BelongsTo] `Organization` (FK: `organization_id`)
  - [BelongsTo] `User` (FK: `sellerId`)
  - [BelongsTo] `PurchaseRequest` (FK: `purchaseRequestId`)
  - [HasOne] `Deal` (FK: `priceQuoteId`)

### `Deal`
- **Physical Table:** `deals`
- **Explicit tableName:** `deals`
- **Usage (Runtime Code):** Used in 8 files
  - `/controllers/dashboardController.js`
  - `/controllers/dealController.js`
  - `/controllers/offerController.js`
  - `/services/dashboardService.js`
  - `/services/dealService.js`
  - `/services/paymentService.js`
  - `/services/quoteService.js`
  - `/services/trustScoreService.js`
- **Associations:**
  - [BelongsTo] `Organization` (FK: `organization_id`)
  - [BelongsTo] `Invoice` (FK: `invoice_id`)
  - [BelongsTo] `User` (FK: `sellerId`)
  - [BelongsTo] `User` (FK: `buyerId`)
  - [BelongsTo] `PurchaseRequest` (FK: `purchaseRequestId`)
  - [HasOne] `CommissionTransaction` (FK: `dealId`)
  - [HasMany] `SupervisorAssignment` (FK: `deal_id`)
- **Indexes:**
  - `deals_purchase_request_id` on fields: purchaseRequestId
  - `deals_seller_id` on fields: sellerId
  - `deals_buyer_id` on fields: buyerId
  - `deals_status` on fields: status
- **Hooks:** beforeUpdate

### `Rating`
- **Physical Table:** `ratings`
- **Explicit tableName:** `ratings`
- **Usage (Runtime Code):** Used in 1 files
  - `/controllers/ratingController.js`
- **Associations:** None
- **Indexes:**
  - `ratings_deal_id` on fields: dealId
  - `ratings_rater_id` on fields: raterId
  - `ratings_rated_user_id` on fields: ratedUserId

### `Notification`
- **Physical Table:** `notifications`
- **Explicit tableName:** `notifications`
- **Usage (Runtime Code):** Used in 6 files
  - `/controllers/notificationController.js`
  - `/controllers/offerController.js`
  - `/controllers/ratingController.js`
  - `/services/notificationPolicyService.js`
  - `/services/notificationService.js`
  - `/routes/notificationRoutes.js`
- **Associations:** None
- **Indexes:**
  - `notifications_created_at` on fields: createdAt

### `SLARecord`
- **Physical Table:** `SLARecords`
- **Explicit tableName:** `Implicit`
- **Usage (Runtime Code):** Used in 1 files
  - `/services/events/SLAConsumer.js`
- **Associations:** None
- **Indexes:**
  - `s_l_a_records_reference_type_reference_id` on fields: referenceType, referenceId
  - `s_l_a_records_status` on fields: status

### `Report`
- **Physical Table:** `reports`
- **Explicit tableName:** `reports`
- **Usage (Runtime Code):** Used in 1 files
  - `/controllers/reportController.js`
- **Associations:** None

### `ProductDNA`
- **Physical Table:** `product_dna`
- **Explicit tableName:** `product_dna`
- **Usage (Runtime Code):** Used in 2 files
  - `/services/CatalogWriteFacade.js`
  - `/jobs/CatalogMigrationWorker.js`
- **Associations:**
  - [BelongsTo] `Category` (FK: `categoryId`)
  - [BelongsToMany] `AttributeSchema` (FK: `dnaId`)
  - [HasMany] `ProductDNAAttribute` (FK: `dnaId`)
  - [HasMany] `SellerListing` (FK: `dnaId`)

### `AttributeSchema`
- **Physical Table:** `attribute_schemas`
- **Explicit tableName:** `attribute_schemas`
- **Usage (Runtime Code):** Used in 1 files
  - `/services/CatalogQueryService.js`
- **Associations:**
  - [BelongsToMany] `ProductDNA` (FK: `attributeId`)
  - [HasMany] `ProductDNAAttribute` (FK: `attributeId`)

### `ProductDNAAttribute`
- **Physical Table:** `product_dna_attributes`
- **Explicit tableName:** `product_dna_attributes`
- **Usage (Runtime Code):** Used in 1 files
  - `/services/CatalogQueryService.js`
- **Associations:**
  - [BelongsTo] `ProductDNA` (FK: `dnaId`)
  - [BelongsTo] `AttributeSchema` (FK: `attributeId`)
- **Indexes:**
  - `product_dna_attributes_dna_id_attribute_id` on fields: dnaId, attributeId
  - `product_dna_attributes_attribute_id` on fields: attributeId

### `SellerListing`
- **Physical Table:** `seller_listings`
- **Explicit tableName:** `seller_listings`
- **Usage (Runtime Code):** Used in 3 files
  - `/services/CatalogWriteFacade.js`
  - `/services/SellerListingService.js`
  - `/jobs/CatalogMigrationWorker.js`
- **Associations:**
  - [BelongsTo] `ProductDNA` (FK: `dnaId`)
  - [BelongsTo] `Organization` (FK: `organizationId`)
  - [BelongsTo] `User` (FK: `createdByUserId`)
- **Indexes:**
  - `seller_listings_dna_id_organization_id` on fields: dnaId, organizationId
  - `seller_listings_organization_id_seller_sku` on fields: organizationId, sellerSku
  - `seller_listings_price` on fields: price
  - `seller_listings_status` on fields: status

### `SmartPricingMatrix`
- **Physical Table:** `SmartPricingMatrices`
- **Explicit tableName:** `Implicit`
- **Usage (Runtime Code):** Used in 2 files
  - `/controllers/commandDashboardController.js`
  - `/services/smartPricingService.js`
- **Associations:** None

### `SmartInventory`
- **Physical Table:** `SmartInventories`
- **Explicit tableName:** `Implicit`
- **Usage (Runtime Code):** Used in 4 files
  - `/controllers/productController.js`
  - `/services/inventory/InventoryService.js`
  - `/services/MatchService.js`
  - `/services/WarehouseAccessService.js`
- **Associations:**
  - [BelongsTo] `Product` (FK: `productId`)
  - [BelongsTo] `User` (FK: `sellerId`)
  - [HasOne] `InventoryMetrics` (FK: `inventoryId`)
  - [HasMany] `AutoReplenishmentOrder` (FK: `inventoryId`)

### `InventoryTransaction`
- **Physical Table:** `InventoryTransactions`
- **Explicit tableName:** `Implicit`
- **Usage (Runtime Code):** Used in 1 files
  - `/services/inventory/InventoryService.js`
- **Associations:** None
- **Indexes:**
  - `inventory_transactions_product_id` on fields: productId
  - `inventory_transactions_organization_id` on fields: organizationId
  - `inventory_transactions_reference_id` on fields: referenceId

### `RefreshToken`
- **Physical Table:** `refresh_tokens`
- **Explicit tableName:** `refresh_tokens`
- **Usage (Runtime Code):** Used in 1 files
  - `/controllers/authController.js`
- **Associations:** None

### `AuditLog`
- **Physical Table:** `audit_logs`
- **Explicit tableName:** `audit_logs`
- **Usage (Runtime Code):** Used in 14 files
  - `/controllers/authController.js`
  - `/controllers/commandDashboardController.js`
  - `/controllers/dashboardController.js`
  - `/controllers/ownerController.js`
  - `/controllers/quoteController.js`
  - `/controllers/requestStatusController.js`
  - `/controllers/userController.js`
  - `/services/auditService.js`
  - `/services/awardService.js`
  - `/services/dataRetentionService.js`
  - `/services/events/AuditLogConsumer.js`
  - `/services/quotationService.js`
  - `/services/requestService.js`
  - `/middleware/auditMiddleware.js`
- **Associations:**
  - [BelongsTo] `Organization` (FK: `organization_id`)

### `ActionLog`
- **Physical Table:** `ActionLogs`
- **Explicit tableName:** `ActionLogs`
- **Usage (Runtime Code):** Used in 3 files
  - `/controllers/EditController.js`
  - `/services/requestService.js`
  - `/middleware/rateLimitMiddleware.js`
- **Associations:** None
- **Hooks:** beforeUpdate, beforeDestroy

### `SystemSetting`
- **Physical Table:** `system_settings`
- **Explicit tableName:** `system_settings`
- **Usage (Runtime Code):** Used in 2 files
  - `/controllers/aiController.js`
  - `/controllers/paymentController.js`
- **Associations:** None

### `InventoryMetrics`
- **Physical Table:** `inventory_metrics`
- **Explicit tableName:** `inventory_metrics`
- **Usage (Runtime Code):** Used in 1 files
  - `/services/InventoryAlertService.js`
- **Associations:**
  - [BelongsTo] `SmartInventory` (FK: `inventoryId`)

### `AutoReplenishmentOrder`
- **Physical Table:** `auto_replenishment_orders`
- **Explicit tableName:** `auto_replenishment_orders`
- **Usage (Runtime Code):** Used in 1 files
  - `/services/AutoReplenishmentService.js`
- **Associations:**
  - [BelongsTo] `SmartInventory` (FK: `inventoryId`)

### `PaymentTransaction`
- **Physical Table:** `payment_transactions`
- **Explicit tableName:** `payment_transactions`
- **Usage (Runtime Code):** Used in 2 files
  - `/services/paymentService.js`
  - `/routes/paymentRoutes.js`
- **Associations:** None
- **Indexes:**
  - `payment_transactions_transaction_id` on fields: transactionId
  - `payment_transactions_deal_id` on fields: dealId
  - `payment_transactions_user_id` on fields: userId
  - `payment_transactions_status` on fields: status
  - `payment_transactions_payment_gateway` on fields: paymentGateway
  - `payment_transactions_created_at` on fields: createdAt
  - `payment_transactions_status_created_at` on fields: status, createdAt
- **Hooks:** beforeUpdate

### `PaymentMethod`
- **Physical Table:** `payment_methods`
- **Explicit tableName:** `payment_methods`
- **Usage (Runtime Code):** Used in 1 files
  - `/services/paymentService.js`
- **Associations:** None
- **Indexes:**
  - `payment_methods_user_id` on fields: userId
  - `payment_methods_token` on fields: token
  - `payment_methods_user_id_is_default` on fields: userId, isDefault
  - `payment_methods_is_active` on fields: isActive
- **Hooks:** beforeUpdate, beforeCreate, beforeSave

### `PaymentAuditLog`
- **Physical Table:** `payment_audit_logs`
- **Explicit tableName:** `payment_audit_logs`
- **Usage (Runtime Code):** ⚠️ NO DIRECT RUNTIME USAGE DETECTED (Possibly ORPHAN)
- **Associations:** None
- **Indexes:**
  - `payment_audit_logs_payment_transaction_id` on fields: paymentTransactionId
  - `payment_audit_logs_user_id` on fields: userId
  - `payment_audit_logs_action` on fields: action
  - `payment_audit_logs_severity` on fields: severity
  - `payment_audit_logs_created_at` on fields: createdAt
  - `payment_audit_logs_action_created_at` on fields: action, createdAt
- **Hooks:** beforeUpdate, beforeDestroy

### `WithdrawalLog`
- **Physical Table:** `withdrawal_logs`
- **Explicit tableName:** `withdrawal_logs`
- **Usage (Runtime Code):** Used in 2 files
  - `/services/quoteService.js`
  - `/services/subscriptionService.js`
- **Associations:** None
- **Indexes:**
  - `withdrawal_logs_user_id` on fields: userId
  - `withdrawal_logs_user_role` on fields: userRole
  - `withdrawal_logs_created_at` on fields: createdAt
  - `withdrawal_logs_user_id_created_at` on fields: userId, createdAt
  - `withdrawal_logs_period_start_period_end` on fields: periodStart, periodEnd

### `AlternativeQuote`
- **Physical Table:** `alternative_quotes`
- **Explicit tableName:** `alternative_quotes`
- **Usage (Runtime Code):** ⚠️ NO DIRECT RUNTIME USAGE DETECTED (Possibly ORPHAN)
- **Associations:** None
- **Indexes:**
  - `alternative_quotes_purchase_request_id` on fields: purchaseRequestId
  - `alternative_quotes_buyer_id` on fields: buyerId
  - `alternative_quotes_alternative_seller_id` on fields: alternativeSellerId
  - `alternative_quotes_status` on fields: status
- **Hooks:** beforeCreate

### `Permission`
- **Physical Table:** `permissions`
- **Explicit tableName:** `permissions`
- **Usage (Runtime Code):** ⚠️ NO DIRECT RUNTIME USAGE DETECTED (Possibly ORPHAN)
- **Associations:**
  - [BelongsToMany] `Role` (FK: `permissionId`)

### `Role`
- **Physical Table:** `roles`
- **Explicit tableName:** `roles`
- **Usage (Runtime Code):** Used in 1 files
  - `/controllers/ownerController.js`
- **Associations:**
  - [BelongsToMany] `Permission` (FK: `roleId`)
  - [BelongsToMany] `User` (FK: `roleId`)

### `RolePermission`
- **Physical Table:** `role_permissions`
- **Explicit tableName:** `role_permissions`
- **Usage (Runtime Code):** ⚠️ NO DIRECT RUNTIME USAGE DETECTED (Possibly ORPHAN)
- **Associations:** None

### `UserRole`
- **Physical Table:** `user_roles`
- **Explicit tableName:** `user_roles`
- **Usage (Runtime Code):** ⚠️ NO DIRECT RUNTIME USAGE DETECTED (Possibly ORPHAN)
- **Associations:** None

### `Region`
- **Physical Table:** `regions`
- **Explicit tableName:** `regions`
- **Usage (Runtime Code):** ⚠️ NO DIRECT RUNTIME USAGE DETECTED (Possibly ORPHAN)
- **Associations:** None

### `City`
- **Physical Table:** `cities`
- **Explicit tableName:** `cities`
- **Usage (Runtime Code):** ⚠️ NO DIRECT RUNTIME USAGE DETECTED (Possibly ORPHAN)
- **Associations:** None

### `Team`
- **Physical Table:** `teams`
- **Explicit tableName:** `teams`
- **Usage (Runtime Code):** ⚠️ NO DIRECT RUNTIME USAGE DETECTED (Possibly ORPHAN)
- **Associations:** None

### `UserContext`
- **Physical Table:** `user_context`
- **Explicit tableName:** `user_context`
- **Usage (Runtime Code):** ⚠️ NO DIRECT RUNTIME USAGE DETECTED (Possibly ORPHAN)
- **Associations:** None

### `Delegation`
- **Physical Table:** `Delegations`
- **Explicit tableName:** `Implicit`
- **Usage (Runtime Code):** Used in 2 files
  - `/controllers/ownerController.js`
  - `/middleware/authorize.js`
- **Associations:**
  - [BelongsTo] `User` (FK: `fromUserId`)
  - [BelongsTo] `User` (FK: `toUserId`)
- **Indexes:**
  - `delegations_from_user_id_to_user_id_is_active` on fields: fromUserId, toUserId, isActive
  - `delegations_to_user_id_expires_at` on fields: toUserId, expiresAt

### `SellerDecision`
- **Physical Table:** `SellerDecisions`
- **Explicit tableName:** `SellerDecisions`
- **Usage (Runtime Code):** Used in 1 files
  - `/services/decisionLogger.js`
- **Associations:**
  - [BelongsTo] `User` (FK: `userId`)
  - [BelongsTo] `PurchaseRequest` (FK: `requestId`)

### `BuyerDecisionContext`
- **Physical Table:** `BuyerDecisionContexts`
- **Explicit tableName:** `BuyerDecisionContexts`
- **Usage (Runtime Code):** ⚠️ NO DIRECT RUNTIME USAGE DETECTED (Possibly ORPHAN)
- **Associations:**
  - [BelongsTo] `User` (FK: `buyerId`)
  - [BelongsTo] `PriceQuote` (FK: `quoteId`)
  - [BelongsTo] `PurchaseRequest` (FK: `requestId`)

### `MarketSilenceEvent`
- **Physical Table:** `MarketSilenceEvents`
- **Explicit tableName:** `MarketSilenceEvents`
- **Usage (Runtime Code):** Used in 1 files
  - `/services/marketMonitoringService.js`
- **Associations:**
  - [BelongsTo] `Category` (FK: `sectorId`)
  - [BelongsTo] `PurchaseRequest` (FK: `requestId`)
- **Indexes:**
  - `market_silence_events_sector_id` on fields: sectorId
  - `market_silence_events_status` on fields: status
  - `market_silence_events_created_at` on fields: createdAt

### `SellerInteractionEvent`
- **Physical Table:** `SellerInteractionEvents`
- **Explicit tableName:** `SellerInteractionEvents`
- **Usage (Runtime Code):** Used in 2 files
  - `/services/marketMonitoringService.js`
  - `/services/requestService.js`
- **Associations:**
  - [BelongsTo] `User` (FK: `sellerId`)
  - [BelongsTo] `PurchaseRequest` (FK: `requestId`)
- **Indexes:**
  - `seller_interaction_events_seller_id_request_id` on fields: sellerId, requestId
  - `seller_interaction_events_interaction_type` on fields: interactionType
  - `seller_interaction_events_timestamp` on fields: timestamp

### `BuyerLimit`
- **Physical Table:** `buyer_limits`
- **Explicit tableName:** `buyer_limits`
- **Usage (Runtime Code):** Used in 1 files
  - `/services/limitService.js`
- **Associations:**
  - [BelongsTo] `User` (FK: `buyerId`)

### `CommissionTransaction`
- **Physical Table:** `commission_transactions`
- **Explicit tableName:** `commission_transactions`
- **Usage (Runtime Code):** Used in 2 files
  - `/services/confirmationService.js`
  - `/services/dealService.js`
- **Associations:**
  - [BelongsTo] `Invoice` (FK: `invoice_id`)
  - [BelongsTo] `Deal` (FK: `dealId`)
  - [BelongsTo] `User` (FK: `sellerId`)
  - [BelongsTo] `User` (FK: `buyerId`)

### `EventLog`
- **Physical Table:** `event_logs`
- **Explicit tableName:** `event_logs`
- **Usage (Runtime Code):** Used in 2 files
  - `/services/eventLogService.js`
  - `/services/supervisorService.js`
- **Associations:** None

### `TrustScore`
- **Physical Table:** `trust_scores`
- **Explicit tableName:** `trust_scores`
- **Usage (Runtime Code):** Used in 1 files
  - `/services/trustScoreService.js`
- **Associations:** None

### `Sanction`
- **Physical Table:** `sanctions`
- **Explicit tableName:** `sanctions`
- **Usage (Runtime Code):** Used in 1 files
  - `/services/sanctionService.js`
- **Associations:** None

### `AdminActionLog`
- **Physical Table:** `admin_action_logs`
- **Explicit tableName:** `admin_action_logs`
- **Usage (Runtime Code):** Used in 1 files
  - `/services/adminActionLogService.js`
- **Associations:** None

### `Invoice`
- **Physical Table:** `invoices`
- **Explicit tableName:** `invoices`
- **Usage (Runtime Code):** Used in 3 files
  - `/services/invoiceService.js`
  - `/routes/invoiceRoutes.js`
  - `/jobs/invoiceCron.js`
- **Associations:**
  - [BelongsTo] `User` (FK: `buyer_id`)
  - [BelongsTo] `User` (FK: `seller_id`)
  - [HasOne] `Deal` (FK: `invoice_id`)
  - [HasMany] `CommissionTransaction` (FK: `invoice_id`)
- **Hooks:** beforeValidate, beforeUpdate

### `SupervisorAssignment`
- **Physical Table:** `supervisor_assignments`
- **Explicit tableName:** `supervisor_assignments`
- **Usage (Runtime Code):** Used in 1 files
  - `/services/supervisorService.js`
- **Associations:**
  - [BelongsTo] `Deal` (FK: `deal_id`)
  - [BelongsTo] `User` (FK: `supervisor_id`)
  - [BelongsTo] `User` (FK: `assigned_by`)
  - [HasMany] `SupervisorCommissionShare` (FK: `assignment_id`)

### `SupervisorCommissionShare`
- **Physical Table:** `supervisor_commission_shares`
- **Explicit tableName:** `supervisor_commission_shares`
- **Usage (Runtime Code):** Used in 3 files
  - `/services/invoiceService.js`
  - `/services/supervisorService.js`
  - `/routes/ownerRoutes.js`
- **Associations:**
  - [BelongsTo] `SupervisorAssignment` (FK: `assignment_id`)
  - [BelongsTo] `User` (FK: `supervisor_id`)
  - [BelongsTo] `Deal` (FK: `deal_id`)

### `SupervisorNotification`
- **Physical Table:** `supervisor_notifications`
- **Explicit tableName:** `supervisor_notifications`
- **Usage (Runtime Code):** Used in 2 files
  - `/services/supervisorService.js`
  - `/routes/supervisorRoutes.js`
- **Associations:**
  - [BelongsTo] `User` (FK: `supervisor_id`)
  - [BelongsTo] `Deal` (FK: `deal_id`)

### `RegionAssignment`
- **Physical Table:** `region_assignments`
- **Explicit tableName:** `region_assignments`
- **Usage (Runtime Code):** Used in 1 files
  - `/services/supervisorService.js`
- **Associations:**
  - [BelongsTo] `User` (FK: `supervisor_id`)
  - [BelongsTo] `User` (FK: `assigned_by`)

### `FailedNotification`
- **Physical Table:** `failed_notifications`
- **Explicit tableName:** `failed_notifications`
- **Usage (Runtime Code):** Used in 2 files
  - `/services/invoiceService.js`
  - `/jobs/invoiceCron.js`
- **Associations:** None

## 2. Migrations Map
Trace of physical tables created, altered, or dropped by migrations.

### Migration: `20260123120000-upgrade-category-to-taxonomy.js`
- **Created Tables:** `UserCategories`
- **Dropped Tables:** `UserCategories`

### Migration: `20260328000000-add-commission-and-limits.js`
- **Created Tables:** `commission_transactions`, `buyer_limits`
- **Dropped Tables:** `buyer_limits`, `commission_transactions`

### Migration: `20260509000000-add-sovereign-tables.js`
- **Created Tables:** `event_logs`, `trust_scores`, `sanctions`, `admin_action_logs`
- **Dropped Tables:** `admin_action_logs`, `sanctions`, `trust_scores`, `event_logs`

### Migration: `20260509000001-create-invoices-system.js`
- **Created Tables:** `invoices`
- **Dropped Tables:** `invoices`

### Migration: `20260509000002-add-supervisor-management-system.js`
- **Created Tables:** `supervisor_assignments`, `supervisor_commission_shares`, `supervisor_notifications`, `region_assignments`
- **Dropped Tables:** `region_assignments`, `supervisor_notifications`, `supervisor_commission_shares`, `supervisor_assignments`

### Migration: `20260711082700-add-asset-type-and-ownership.js`
- **Created Tables:** `AssetTypes`
- **Dropped Tables:** `AssetTypes`

## 3. Raw Runtime & Raw SQL Map
We found raw SQL usage or `sequelize.query` calls in 2 files.
- `/services/requestService.js`
- `/routes/authRoutes.js`

## 4. Architecture Dependency Graph
Incoming and Outgoing Foreign Key dependencies per physical table.

### Table: `users`
- **Incoming FKs:** Products (sellerId), PurchaseRequests (userId), PurchaseOrders (buyerId), Receipts (buyerId), PriceQuotes (sellerId), deals (sellerId), deals (buyerId), seller_listings (createdByUserId), SmartInventories (sellerId), Delegations (fromUserId), Delegations (toUserId), SellerDecisions (userId), BuyerDecisionContexts (buyerId), SellerInteractionEvents (sellerId), buyer_limits (buyerId), commission_transactions (sellerId), commission_transactions (buyerId), invoices (buyer_id), invoices (seller_id), supervisor_assignments (supervisor_id), supervisor_assignments (assigned_by), supervisor_commission_shares (supervisor_id), supervisor_notifications (supervisor_id), region_assignments (supervisor_id), region_assignments (assigned_by)
- **Outgoing FKs:** None

### Table: `Categories`
- **Incoming FKs:** Categories (parentId), Products (categoryId), PurchaseRequests (categoryId), PurchaseRequestItems (categoryId), product_dna (categoryId), MarketSilenceEvents (sectorId)
- **Outgoing FKs:** Categories (parentId)

### Table: `UserCategories`
- **Incoming FKs:** None
- **Outgoing FKs:** None

### Table: `organizations`
- **Incoming FKs:** Products (ownerOrganizationId), PurchaseRequests (organization_id), PurchaseRequestInvitations (sellerOrganizationId), Quotations (sellerOrganizationId), Awards (sellerOrganizationId), AwardLines (sellerOrganizationId), PurchaseOrders (sellerOrganizationId), Shipments (sellerOrganizationId), PriceQuotes (organization_id), deals (organization_id), seller_listings (organizationId), audit_logs (organization_id)
- **Outgoing FKs:** None

### Table: `organization_users`
- **Incoming FKs:** None
- **Outgoing FKs:** None

### Table: `AssetTypes`
- **Incoming FKs:** Products (assetTypeId), PurchaseRequests (assetTypeId)
- **Outgoing FKs:** None

### Table: `Products`
- **Incoming FKs:** SmartInventories (productId)
- **Outgoing FKs:** users (sellerId), organizations (ownerOrganizationId), Categories (categoryId), AssetTypes (assetTypeId)

### Table: `PurchaseRequests`
- **Incoming FKs:** PurchaseRequestItems (purchaseRequestId), PurchaseRequestInvitations (purchaseRequestId), Quotations (purchaseRequestId), Awards (purchaseRequestId), PriceQuotes (purchaseRequestId), deals (purchaseRequestId), SellerDecisions (requestId), BuyerDecisionContexts (requestId), MarketSilenceEvents (requestId), SellerInteractionEvents (requestId)
- **Outgoing FKs:** organizations (organization_id), users (userId), Categories (categoryId), AssetTypes (assetTypeId)

### Table: `PurchaseRequestItems`
- **Incoming FKs:** QuotationItems (purchaseRequestItemId), AwardLines (purchaseRequestItemId)
- **Outgoing FKs:** PurchaseRequests (purchaseRequestId), product_dna (productDNAId), Categories (categoryId)

### Table: `product_dna`
- **Incoming FKs:** PurchaseRequestItems (productDNAId), QuotationItems (productDNAId), AwardLines (productDNAId), PurchaseOrderLines (productDNAId), product_dna_attributes (dnaId), seller_listings (dnaId)
- **Outgoing FKs:** Categories (categoryId)

### Table: `PurchaseRequestInvitations`
- **Incoming FKs:** Quotations (invitationId)
- **Outgoing FKs:** PurchaseRequests (purchaseRequestId), organizations (sellerOrganizationId)

### Table: `Quotations`
- **Incoming FKs:** QuotationItems (quotationId)
- **Outgoing FKs:** PurchaseRequests (purchaseRequestId), organizations (sellerOrganizationId), PurchaseRequestInvitations (invitationId)

### Table: `QuotationItems`
- **Incoming FKs:** AwardLines (quotationItemId)
- **Outgoing FKs:** Quotations (quotationId), PurchaseRequestItems (purchaseRequestItemId), product_dna (productDNAId)

### Table: `Awards`
- **Incoming FKs:** AwardLines (awardId), PurchaseOrders (awardId)
- **Outgoing FKs:** PurchaseRequests (purchaseRequestId), organizations (sellerOrganizationId)

### Table: `AwardLines`
- **Incoming FKs:** PurchaseOrderLines (awardLineId)
- **Outgoing FKs:** Awards (awardId), PurchaseRequestItems (purchaseRequestItemId), QuotationItems (quotationItemId), organizations (sellerOrganizationId), product_dna (productDNAId)

### Table: `PurchaseOrders`
- **Incoming FKs:** PurchaseOrderLines (purchaseOrderId), Shipments (purchaseOrderId), Receipts (purchaseOrderId)
- **Outgoing FKs:** Awards (awardId), users (buyerId), organizations (sellerOrganizationId)

### Table: `PurchaseOrderLines`
- **Incoming FKs:** ShipmentLines (purchaseOrderLineId), ReceiptLines (purchaseOrderLineId)
- **Outgoing FKs:** PurchaseOrders (purchaseOrderId), AwardLines (awardLineId), product_dna (productDNAId)

### Table: `Shipments`
- **Incoming FKs:** ShipmentLines (shipmentId), Receipts (shipmentId)
- **Outgoing FKs:** PurchaseOrders (purchaseOrderId), organizations (sellerOrganizationId)

### Table: `ShipmentLines`
- **Incoming FKs:** None
- **Outgoing FKs:** Shipments (shipmentId), PurchaseOrderLines (purchaseOrderLineId)

### Table: `Receipts`
- **Incoming FKs:** ReceiptLines (receiptId)
- **Outgoing FKs:** PurchaseOrders (purchaseOrderId), Shipments (shipmentId), users (buyerId)

### Table: `ReceiptLines`
- **Incoming FKs:** None
- **Outgoing FKs:** Receipts (receiptId), PurchaseOrderLines (purchaseOrderLineId)

### Table: `PriceQuotes`
- **Incoming FKs:** BuyerDecisionContexts (quoteId)
- **Outgoing FKs:** organizations (organization_id), users (sellerId), PurchaseRequests (purchaseRequestId)

### Table: `deals`
- **Incoming FKs:** commission_transactions (dealId), supervisor_assignments (deal_id), supervisor_commission_shares (deal_id), supervisor_notifications (deal_id)
- **Outgoing FKs:** organizations (organization_id), invoices (invoice_id), users (sellerId), users (buyerId), PurchaseRequests (purchaseRequestId)

### Table: `invoices`
- **Incoming FKs:** deals (invoice_id), commission_transactions (invoice_id)
- **Outgoing FKs:** users (buyer_id), users (seller_id)

### Table: `ratings`
- **Incoming FKs:** None
- **Outgoing FKs:** None

### Table: `notifications`
- **Incoming FKs:** None
- **Outgoing FKs:** None

### Table: `SLARecords`
- **Incoming FKs:** None
- **Outgoing FKs:** None

### Table: `reports`
- **Incoming FKs:** None
- **Outgoing FKs:** None

### Table: `attribute_schemas`
- **Incoming FKs:** product_dna_attributes (attributeId)
- **Outgoing FKs:** None

### Table: `product_dna_attributes`
- **Incoming FKs:** None
- **Outgoing FKs:** product_dna (dnaId), attribute_schemas (attributeId)

### Table: `seller_listings`
- **Incoming FKs:** None
- **Outgoing FKs:** product_dna (dnaId), organizations (organizationId), users (createdByUserId)

### Table: `SmartPricingMatrices`
- **Incoming FKs:** None
- **Outgoing FKs:** None

### Table: `SmartInventories`
- **Incoming FKs:** inventory_metrics (inventoryId), auto_replenishment_orders (inventoryId)
- **Outgoing FKs:** Products (productId), users (sellerId)

### Table: `InventoryTransactions`
- **Incoming FKs:** None
- **Outgoing FKs:** None

### Table: `refresh_tokens`
- **Incoming FKs:** None
- **Outgoing FKs:** None

### Table: `audit_logs`
- **Incoming FKs:** None
- **Outgoing FKs:** organizations (organization_id)

### Table: `ActionLogs`
- **Incoming FKs:** None
- **Outgoing FKs:** None

### Table: `system_settings`
- **Incoming FKs:** None
- **Outgoing FKs:** None

### Table: `inventory_metrics`
- **Incoming FKs:** None
- **Outgoing FKs:** SmartInventories (inventoryId)

### Table: `auto_replenishment_orders`
- **Incoming FKs:** None
- **Outgoing FKs:** SmartInventories (inventoryId)

### Table: `payment_transactions`
- **Incoming FKs:** None
- **Outgoing FKs:** None

### Table: `payment_methods`
- **Incoming FKs:** None
- **Outgoing FKs:** None

### Table: `payment_audit_logs`
- **Incoming FKs:** None
- **Outgoing FKs:** None

### Table: `withdrawal_logs`
- **Incoming FKs:** None
- **Outgoing FKs:** None

### Table: `alternative_quotes`
- **Incoming FKs:** None
- **Outgoing FKs:** None

### Table: `permissions`
- **Incoming FKs:** None
- **Outgoing FKs:** None

### Table: `roles`
- **Incoming FKs:** None
- **Outgoing FKs:** None

### Table: `role_permissions`
- **Incoming FKs:** None
- **Outgoing FKs:** None

### Table: `user_roles`
- **Incoming FKs:** None
- **Outgoing FKs:** None

### Table: `regions`
- **Incoming FKs:** None
- **Outgoing FKs:** None

### Table: `cities`
- **Incoming FKs:** None
- **Outgoing FKs:** None

### Table: `teams`
- **Incoming FKs:** None
- **Outgoing FKs:** None

### Table: `user_context`
- **Incoming FKs:** None
- **Outgoing FKs:** None

### Table: `Delegations`
- **Incoming FKs:** None
- **Outgoing FKs:** users (fromUserId), users (toUserId)

### Table: `SellerDecisions`
- **Incoming FKs:** None
- **Outgoing FKs:** users (userId), PurchaseRequests (requestId)

### Table: `BuyerDecisionContexts`
- **Incoming FKs:** None
- **Outgoing FKs:** users (buyerId), PriceQuotes (quoteId), PurchaseRequests (requestId)

### Table: `MarketSilenceEvents`
- **Incoming FKs:** None
- **Outgoing FKs:** Categories (sectorId), PurchaseRequests (requestId)

### Table: `SellerInteractionEvents`
- **Incoming FKs:** None
- **Outgoing FKs:** users (sellerId), PurchaseRequests (requestId)

### Table: `buyer_limits`
- **Incoming FKs:** None
- **Outgoing FKs:** users (buyerId)

### Table: `commission_transactions`
- **Incoming FKs:** None
- **Outgoing FKs:** invoices (invoice_id), deals (dealId), users (sellerId), users (buyerId)

### Table: `event_logs`
- **Incoming FKs:** None
- **Outgoing FKs:** None

### Table: `trust_scores`
- **Incoming FKs:** None
- **Outgoing FKs:** None

### Table: `sanctions`
- **Incoming FKs:** None
- **Outgoing FKs:** None

### Table: `admin_action_logs`
- **Incoming FKs:** None
- **Outgoing FKs:** None

### Table: `supervisor_assignments`
- **Incoming FKs:** supervisor_commission_shares (assignment_id)
- **Outgoing FKs:** deals (deal_id), users (supervisor_id), users (assigned_by)

### Table: `supervisor_commission_shares`
- **Incoming FKs:** None
- **Outgoing FKs:** supervisor_assignments (assignment_id), users (supervisor_id), deals (deal_id)

### Table: `supervisor_notifications`
- **Incoming FKs:** None
- **Outgoing FKs:** users (supervisor_id), deals (deal_id)

### Table: `region_assignments`
- **Incoming FKs:** None
- **Outgoing FKs:** users (supervisor_id), users (assigned_by)

### Table: `failed_notifications`
- **Incoming FKs:** None
- **Outgoing FKs:** None

## 5. Duplicate Entities Analysis
Detecting mismatch between physical tables and explicit definitions (e.g., Users vs users).

*(Note: Further discrepancies between Migration casing and Model casing must be cross-checked manually. Commonly `Users` vs `users` occurs if explicitly forced in sequelize.)*

## 6. Final Canonical Architecture (Classification)
Classifying tables according to functional domain.

- **User** (`users`) -> `CORE`
- **Category** (`Categories`) -> `CORE`
- **UserCategory** (`UserCategories`) -> `ORPHAN`
- **Organization** (`organizations`) -> `CORE`
- **OrganizationUser** (`organization_users`) -> `SUPPORT`
- **AssetType** (`AssetTypes`) -> `ORPHAN`
- **Product** (`Products`) -> `DOMAIN`
- **PurchaseRequest** (`PurchaseRequests`) -> `DOMAIN`
- **PurchaseRequestItem** (`PurchaseRequestItems`) -> `DOMAIN`
- **PurchaseRequestInvitation** (`PurchaseRequestInvitations`) -> `DOMAIN`
- **Quotation** (`Quotations`) -> `DOMAIN`
- **QuotationItem** (`QuotationItems`) -> `DOMAIN`
- **Award** (`Awards`) -> `DOMAIN`
- **AwardLine** (`AwardLines`) -> `DOMAIN`
- **PurchaseOrder** (`PurchaseOrders`) -> `DOMAIN`
- **PurchaseOrderLine** (`PurchaseOrderLines`) -> `DOMAIN`
- **Shipment** (`Shipments`) -> `DOMAIN`
- **ShipmentLine** (`ShipmentLines`) -> `DOMAIN`
- **Receipt** (`Receipts`) -> `DOMAIN`
- **ReceiptLine** (`ReceiptLines`) -> `DOMAIN`
- **PriceQuote** (`PriceQuotes`) -> `SUPPORT`
- **Deal** (`deals`) -> `DOMAIN`
- **Rating** (`ratings`) -> `SUPPORT`
- **Notification** (`notifications`) -> `SUPPORT`
- **SLARecord** (`SLARecords`) -> `SUPPORT`
- **Report** (`reports`) -> `SUPPORT`
- **ProductDNA** (`product_dna`) -> `DOMAIN`
- **AttributeSchema** (`attribute_schemas`) -> `SUPPORT`
- **ProductDNAAttribute** (`product_dna_attributes`) -> `DOMAIN`
- **SellerListing** (`seller_listings`) -> `DOMAIN`
- **SmartPricingMatrix** (`SmartPricingMatrices`) -> `SUPPORT`
- **SmartInventory** (`SmartInventories`) -> `DOMAIN`
- **InventoryTransaction** (`InventoryTransactions`) -> `SUPPORT`
- **RefreshToken** (`refresh_tokens`) -> `SECURITY`
- **AuditLog** (`audit_logs`) -> `SECURITY`
- **ActionLog** (`ActionLogs`) -> `SUPPORT`
- **SystemSetting** (`system_settings`) -> `SUPPORT`
- **InventoryMetrics** (`inventory_metrics`) -> `ANALYTICS`
- **AutoReplenishmentOrder** (`auto_replenishment_orders`) -> `DOMAIN`
- **PaymentTransaction** (`payment_transactions`) -> `SUPPORT`
- **PaymentMethod** (`payment_methods`) -> `SUPPORT`
- **PaymentAuditLog** (`payment_audit_logs`) -> `ORPHAN`
- **WithdrawalLog** (`withdrawal_logs`) -> `SUPPORT`
- **AlternativeQuote** (`alternative_quotes`) -> `ORPHAN`
- **Permission** (`permissions`) -> `ORPHAN`
- **Role** (`roles`) -> `CORE`
- **RolePermission** (`role_permissions`) -> `ORPHAN`
- **UserRole** (`user_roles`) -> `ORPHAN`
- **Region** (`regions`) -> `ORPHAN`
- **City** (`cities`) -> `ORPHAN`
- **Team** (`teams`) -> `ORPHAN`
- **UserContext** (`user_context`) -> `ORPHAN`
- **Delegation** (`Delegations`) -> `SUPPORT`
- **SellerDecision** (`SellerDecisions`) -> `ANALYTICS`
- **BuyerDecisionContext** (`BuyerDecisionContexts`) -> `ORPHAN`
- **MarketSilenceEvent** (`MarketSilenceEvents`) -> `ANALYTICS`
- **SellerInteractionEvent** (`SellerInteractionEvents`) -> `ANALYTICS`
- **BuyerLimit** (`buyer_limits`) -> `SUPPORT`
- **CommissionTransaction** (`commission_transactions`) -> `SUPPORT`
- **EventLog** (`event_logs`) -> `SUPPORT`
- **TrustScore** (`trust_scores`) -> `SECURITY`
- **Sanction** (`sanctions`) -> `SECURITY`
- **AdminActionLog** (`admin_action_logs`) -> `SUPPORT`
- **Invoice** (`invoices`) -> `DOMAIN`
- **SupervisorAssignment** (`supervisor_assignments`) -> `SUPPORT`
- **SupervisorCommissionShare** (`supervisor_commission_shares`) -> `SUPPORT`
- **SupervisorNotification** (`supervisor_notifications`) -> `SUPPORT`
- **RegionAssignment** (`region_assignments`) -> `SUPPORT`
- **FailedNotification** (`failed_notifications`) -> `SUPPORT`

## 7. Future Architecture Design (B2B Marketplace)

> **Notice:** Safest long-term architecture for this specific platform.

### Requirements Supported
- AI, Marketplace, Procurement, Inventory, Quotations, RFQ Workflow, Future ERP, Future BI, Future ML

### The Blueprint Strategy
1. **Core Data Immutability:** Never DELETE records in Core/Domain (use Soft Deletes). 
2. **AI Read Layer:** Implement Read Replicas dedicated to AI context retrieval and Semantic Search (pgvector).
3. **Analytics Layer:** Separate Data Warehouse for BI. Use asynchronous replication or ETL jobs for `EventLog`, `MarketSilenceEvent`.
4. **Caching & Queue:** Redis for volatile state (sessions, live bids, websocket states, caching user permissions).

### Future Structural Layers
- `L1 (Operational DB)`: Highly normalized. Postgres. Handling Transactions, RFQs, Quotes.
- `L2 (AI/Search Vector Layer)`: Extracted ProductDNA, User profiles encoded via embeddings.
- `L3 (Data Warehouse / BI)`: Parquet/Clickhouse for historical analytics, SLA tracking, TrustScore modeling.

## 8. Complete Database Blueprint Visualization

```mermaid
graph TD
    subgraph Operational DB (Production)
      User --- Organization
      Organization --- Product
      User --- PurchaseRequest
      PurchaseRequest --- Quotation
      Quotation --- PurchaseOrder
      PurchaseOrder --- Invoice
      PurchaseOrder --- Shipment
    end
    
    subgraph AI Read Layer (Search/Semantic)
      Product_Vectors[ProductDNA Vectors]
      Supplier_Vectors[Supplier Profiles]
    end
    
    subgraph Analytics & ML (Future BI)
      BI_Events[SellerInteractionEvent]
      BI_Decisions[BuyerDecisionContext]
      BI_SLA[SLARecord]
    end
    
    Operational DB -.->|ETL / CDC| AI Read Layer
    Operational DB -.->|ETL / Logs| Analytics & ML
```
