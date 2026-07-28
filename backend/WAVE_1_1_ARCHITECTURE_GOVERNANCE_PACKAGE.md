# 🏗️ ARCHITECTURE GOVERNANCE PACKAGE v1.1
> Moving from Architecture-Only to Implementation Traceability. This document bridges the gap between Bounded Contexts and real-world codebase files.

## TASK 1: Current Reality Mapping
### Aggregate: `PurchaseRequest`
- **Current Models:** `/models/BuyerDecisionContext.js`, `/models/MarketSilenceEvent.js`, `/models/PurchaseRequest.js`, `/models/SellerInteractionEvent.js`
- **Current Repositories:** `/infrastructure/repositories/PurchaseRequestRepository.js`
- **Current Services:** `/services/AutoNegotiationService.js`, `/services/awardService.js`, `/services/dashboardService.js`, `/services/dealService.js`, `/services/emailService.js`, `/services/limitService.js`, `/services/marketMonitoringService.js`, `/services/MatchService.js`, `/services/notificationPolicyService.js`, `/services/priceRadarService.js`, `/services/pricingEngine.js`, `/services/procurementService.js`, `/services/quotationService.js`, `/services/quoteService.js`, `/services/requestService.js`, `/services/requestServiceHelpers.js`, `/services/statusTransitionService.js`, `/services/trustScoreService.js`, `/services/userService.js`, `/services/WarehouseAccessService.js`
- **Current Controllers:** `/controllers/commandDashboardController.js`, `/controllers/dashboardController.js`, `/controllers/dealController.js`, `/controllers/invoiceController.js`, `/controllers/ownerController.js`, `/controllers/quoteController.js`, `/controllers/reportController.js`, `/controllers/requestController.js`, `/controllers/requestStatusController.js`
- **Current Routes:** `/routes/chatRoutes.js`, `/routes/quoteRoutes.js`, `/routes/requestRoutes.js`
- **Current GraphQL Resolvers:** `/src/api/graphql/resolvers.js`, `/src/api/graphql/schema.js`
- **Current Migrations:** `/migrations/add_command_2_fields.js`
- **Current Tests:** `/bootstrap/tests/compositionRoot.test.js`, `/engine/intake/tests/commercialAssetMapper.test.js`, `/scripts/testIntegrationOrg.js`, `/tests/chat_integration.js`, `/tests/intakeApi.test.js`, `/tests/integration/intakeE2E.test.js`, `/tests/logic-stress-test.js`, `/tests/notification_integration.js`, `/tests/price_radar_integration.js`

### Aggregate: `Quotation`
- **Current Models:** `/models/AwardLine.js`, `/models/PurchaseOrder.js`, `/models/Quotation.js`
- **Current Repositories:** *None found*
- **Current Services:** `/services/awardService.js`, `/services/procurementService.js`, `/services/quotationService.js`, `/services/requestService.js`
- **Current Controllers:** `/controllers/quotationController.js`
- **Current Routes:** *None found*
- **Current GraphQL Resolvers:** *None found*
- **Current Migrations:** *None found*
- **Current Tests:** *None found*

### Aggregate: `Award`
- **Current Models:** `/models/Award.js`, `/models/AwardLine.js`, `/models/Deal.js`, `/models/PurchaseOrder.js`
- **Current Repositories:** *None found*
- **Current Services:** `/services/awardService.js`, `/services/procurementService.js`
- **Current Controllers:** `/controllers/purchaseOrderController.js`
- **Current Routes:** *None found*
- **Current GraphQL Resolvers:** *None found*
- **Current Migrations:** *None found*
- **Current Tests:** *None found*

### Aggregate: `Deal`
- **Current Models:** `/models/AssetType.js`, `/models/CommissionTransaction.js`, `/models/Deal.js`, `/models/Invoice.js`, `/models/Notification.js`, `/models/Report.js`, `/models/WithdrawalLog.js`
- **Current Repositories:** *None found*
- **Current Services:** `/services/AutoNegotiationService.js`, `/services/confirmationService.js`, `/services/dashboardService.js`, `/services/dealService.js`, `/services/emailService.js`, `/services/invoiceService.js`, `/services/paymentService.js`, `/services/quoteService.js`, `/services/requestService.js`, `/services/requestServiceHelpers.js`, `/services/subscriptionService.js`, `/services/supervisorService.js`, `/services/SupplierQualificationService.js`, `/services/trustScoreService.js`
- **Current Controllers:** `/controllers/dashboardController.js`, `/controllers/dealController.js`, `/controllers/invoiceController.js`, `/controllers/offerController.js`, `/controllers/paymentController.js`, `/controllers/quoteController.js`, `/controllers/ratingController.js`, `/controllers/reportController.js`
- **Current Routes:** `/routes/chatRoutes.js`, `/routes/ownerRoutes.js`, `/routes/paymentRoutes.js`
- **Current GraphQL Resolvers:** `/src/api/graphql/resolvers.js`, `/src/api/graphql/schema.js`
- **Current Migrations:** `/migrations/20260509000001-create-invoices-system.js`
- **Current Tests:** `/scripts/testIntegrationOrg.js`, `/tests/invoice.test.js`, `/tests/notification_integration.js`, `/tests/supervisorSystem.test.js`, `/tests/test_v2_logic.js`

### Aggregate: `PurchaseOrder`
- **Current Models:** `/models/InventoryTransaction.js`, `/models/PurchaseOrder.js`
- **Current Repositories:** *None found*
- **Current Services:** `/services/events/NotificationConsumer.js`, `/services/events/SLAConsumer.js`, `/services/fulfillment/PreparationModule.js`, `/services/fulfillment/ReceiptModule.js`, `/services/fulfillment/StateProjectionModule.js`, `/services/inventory/InventoryService.js`, `/services/procurementService.js`
- **Current Controllers:** *None found*
- **Current Routes:** *None found*
- **Current GraphQL Resolvers:** *None found*
- **Current Migrations:** *None found*
- **Current Tests:** *None found*

### Aggregate: `Invoice`
- **Current Models:** `/models/Deal.js`, `/models/Invoice.js`
- **Current Repositories:** *None found*
- **Current Services:** `/services/confirmationService.js`, `/services/dealService.js`, `/services/invoiceService.js`, `/services/subscriptionService.js`
- **Current Controllers:** `/controllers/invoiceController.js`
- **Current Routes:** `/routes/adminRoutes.js`, `/routes/invoiceRoutes.js`
- **Current GraphQL Resolvers:** *None found*
- **Current Migrations:** `/migrations/20260713060732-add-invoice-sequence.js`
- **Current Tests:** `/tests/invoice.test.js`

### Aggregate: `Organization`
- **Current Models:** `/models/Organization.js`
- **Current Repositories:** *None found*
- **Current Services:** `/services/CatalogQueryBuilder.js`, `/services/CatalogQueryService.js`, `/services/quoteService.js`, `/services/requestService.js`, `/services/SellerListingService.js`
- **Current Controllers:** `/controllers/authController.js`, `/controllers/quotationController.js`, `/controllers/userController.js`
- **Current Routes:** *None found*
- **Current GraphQL Resolvers:** *None found*
- **Current Migrations:** *None found*
- **Current Tests:** `/scripts/testIntegrationOrg.js`

### Aggregate: `User`
- **Current Models:** `/models/AdminActionLog.js`, `/models/BuyerDecisionContext.js`, `/models/BuyerLimit.js`, `/models/CommissionTransaction.js`, `/models/Delegation.js`, `/models/EventLog.js`, `/models/Invoice.js`, `/models/PaymentAuditLog.js`, `/models/PaymentMethod.js`, `/models/PaymentTransaction.js`, `/models/Product.js`, `/models/Report.js`, `/models/Sanction.js`, `/models/SellerDecision.js`, `/models/SellerInteractionEvent.js`, `/models/SmartInventory.js`, `/models/TrustScore.js`, `/models/User.js`, `/models/UserContext.js`, `/models/WithdrawalLog.js`
- **Current Repositories:** *None found*
- **Current Services:** `/services/auditService.js`, `/services/CatalogWriteFacade.js`, `/services/dashboardService.js`, `/services/decisionLogger.js`, `/services/emailService.js`, `/services/events/NotificationConsumer.js`, `/services/fulfillment/StateProjectionModule.js`, `/services/InventoryAlertService.js`, `/services/invoiceService.js`, `/services/negotiationPolicyService.js`, `/services/notificationPolicyService.js`, `/services/notificationService.js`, `/services/paymentService.js`, `/services/pricingEngine.js`, `/services/quoteService.js`, `/services/RBACService.js`, `/services/requestService.js`, `/services/requestServiceHelpers.js`, `/services/statusTransitionService.js`, `/services/subscriptionService.js`, `/services/SupplierQualificationService.js`, `/services/tierValidationService.js`, `/services/userService.js`, `/services/WarehouseAccessService.js`
- **Current Controllers:** `/controllers/adminController.js`, `/controllers/authController.js`, `/controllers/awardController.js`, `/controllers/dashboardController.js`, `/controllers/dealController.js`, `/controllers/EditController.js`, `/controllers/intakeController.js`, `/controllers/notificationController.js`, `/controllers/offerController.js`, `/controllers/ownerController.js`, `/controllers/paymentController.js`, `/controllers/pricingMatrixController.js`, `/controllers/productController.js`, `/controllers/purchaseOrderController.js`, `/controllers/quotationController.js`, `/controllers/quoteController.js`, `/controllers/ratingController.js`, `/controllers/reportController.js`, `/controllers/requestController.js`, `/controllers/requestStatusController.js`, `/controllers/transactionController.js`, `/controllers/userController.js`
- **Current Routes:** `/routes/adminRoutes.js`, `/routes/agentRoutes.js`, `/routes/authRoutes.js`, `/routes/chatRoutes.js`, `/routes/invoiceRoutes.js`, `/routes/notificationRoutes.js`, `/routes/ownerRoutes.js`, `/routes/paymentRoutes.js`, `/routes/ratingRoutes.js`, `/routes/requestRoutes.js`, `/routes/smartPricingRoutes.js`, `/routes/supervisorRoutes.js`, `/routes/test-admin-permissions.js`
- **Current GraphQL Resolvers:** `/src/api/graphql/context.js`, `/src/api/graphql/resolvers.js`, `/src/api/graphql/schema.js`
- **Current Migrations:** `/migrations/20251208193920-add-device-fingerprint.js`
- **Current Tests:** `/engine/intake/tests/commercialAssetMapper.test.js`, `/engine/intake/tests/intakeEngine.test.js`, `/scripts/testFindOne.js`, `/scripts/testIntegrationOrg.js`, `/scripts/testModel.js`, `/scripts/testModelAttrs.js`, `/test-server-simple.js`, `/tests/chat_integration.js`, `/tests/comprehensive_verification.js`, `/tests/intakeApi.test.js`, `/tests/integration/auth.test.js`, `/tests/integration/contract.test.js`, `/tests/integration/fraudDetection.test.js`, `/tests/integration/intakeAuth.test.js`, `/tests/integration/intakeE2E.test.js`, `/tests/integration/legacyAdapter.test.js`, `/tests/invoice.test.js`, `/tests/logic-stress-test.js`, `/tests/notification_integration.js`, `/tests/price_radar_integration.js`, `/tests/security/securityControls.test.js`, `/tests/security_check.js`, `/tests/seed_seller.js`, `/tests/sovereign-live-fire.test.js`, `/tests/supervisorSystem.test.js`, `/tests/test_v2_logic.js`, `/tests/unit/errors.test.js`, `/tests/unit/fraudDetection.test.js`, `/tests/unit/PolicyEngine.test.js`, `/tests/unit/RBACService.test.js`, `/tests/unit_request_service.js`, `/tests/validation_verification.js`

### Aggregate: `Product`
- **Current Models:** `/models/Product.js`, `/models/SmartInventory.js`
- **Current Repositories:** `/infrastructure/repositories/ProductRepository.js`
- **Current Services:** `/services/AutoReplenishmentService.js`, `/services/CatalogQueryService.js`, `/services/CatalogWriteFacade.js`, `/services/inventory/InventoryService.js`, `/services/InventoryAlertService.js`, `/services/inventoryEngine.js`, `/services/MatchService.js`, `/services/negotiationPolicyService.js`, `/services/notificationPolicyService.js`, `/services/pricingEngine.js`, `/services/SellerListingService.js`, `/services/smartPricingService.js`, `/services/SupplierQualificationService.js`, `/services/WarehouseAccessService.js`
- **Current Controllers:** `/controllers/dashboardController.js`, `/controllers/productController.js`
- **Current Routes:** `/routes/agentRoutes.js`, `/routes/productRoutes.js`
- **Current GraphQL Resolvers:** *None found*
- **Current Migrations:** *None found*
- **Current Tests:** `/bootstrap/tests/compositionRoot.test.js`, `/engine/intake/tests/commercialAssetMapper.test.js`, `/engine/intake/tests/intakeEngine.test.js`, `/tests/intakeApi.test.js`, `/tests/integration/contract.test.js`, `/tests/integration/intakeE2E.test.js`, `/tests/integration/legacyAdapter.test.js`, `/tests/integration/rollback.test.js`, `/tests/test_v2_logic.js`, `/tests/validation_verification.js`

## TASK 2: Gap Analysis
| Aggregate | Current State | Target State | Gap | Priority | Risk | Estimated Effort |
|---|---|---|---|---|---|---|
| **PurchaseRequest** | Scattered logic in Controller. Child items mutated directly. | Pure Domain Service. Items mutated ONLY via PR. | Lack of strict Root boundaries. | 🔴 High | High (Data consistency) | 5 Days |
| **Quotation** | Tightly coupled to PR sync. No Deal context. | Async generation. Owns QuotationItems. | Sync coupling. | 🔴 High | Medium | 3 Days |
| **Invoice** | Relies on PurchaseOrder. | Relies ONLY on Deal. | Structural FK dependency incorrect. | 🟡 Medium | High (Billing impact) | 7 Days |
| **User** | Cross-domain mutations. High file usage. | IAM Context only. Accessed via API/ACL. | Excessive direct DB reads from other domains. | 🔴 Critical | High (Security) | 14 Days |

## TASK 3: Repository Ownership & Allowed Methods
Child repositories (e.g., `PurchaseRequestItemRepository`) **MUST BE DELETED**. All access goes through the Root.

### `PurchaseRequestRepository`
- **Allowed:** `Create(PR)`, `Update(PR)`, `Publish(PR)`, `Cancel(PR)`, `FindById(Id)`, `FindDrafts()`.
- **Forbidden:** `UpdateItem()`, `DeleteItem()` (Items must be replaced in bulk via `Update(PR)`).

## TASK 4: Service Ownership Matrix
| Service | Owner Domain | Allowed Dependencies | Forbidden Dependencies | Public Interface | Internal Interface |
|---|---|---|---|---|---|
| `RequestService` | Procurement | `IdentityAPI`, `CatalogAPI` | `FinanceDB`, `SourcingDB` | `createRequest`, `publishRequest` | `validateItems` |
| `QuotationService` | Sourcing | `ProcurementAPI` | `FulfillmentDB` | `submitQuote`, `awardQuote` | `calculateQuoteTax` |
| `InvoiceService` | Finance | `FulfillmentAPI` | `ProcurementDB`, `CatalogDB` | `generateInvoice` | `applyCommission` |

## TASK 5: Event Contracts (Standardized Definitions)
### `RequestPublishedEvent`
- **Version:** `v1.0`
- **Payload Schema:** `{ eventId: UUID, requestId: UUID, buyerId: UUID, timestamp: ISO8601 }`
- **Producer:** Procurement Domain
- **Consumers:** Communication, Decision Support, Observability
- **Ordering Guarantee:** At-least-once, unordered (Consumers must handle).
- **Retry Strategy:** Exponential Backoff (Max 5 retries).
- **Idempotency Key:** `eventId`
- **Dead Letter Strategy:** Route to DLQ after 5 failures. Alert Admin.
- **Retention:** 30 Days (Hot), 7 Years (Cold Archive).
- **Replay Policy:** Supported via EventLog.
- **Backward Compatibility:** Additive changes only. Breaking changes require `v2.0`.

## TASK 6: Transaction Specification
### Scenario: Accept Quotation (Award)
```text
BEGIN TRANSACTION
  Validation Order:
    1. Quotation is PENDING.
    2. PurchaseRequest is PUBLISHED.
  Lock Strategy: SELECT FOR UPDATE (Pessimistic on Quotation).
  Isolation Level: READ COMMITTED.
  Operations:
    1. UPDATE Quotation SET Status = ACCEPTED;
    2. INSERT Award;
    3. UPDATE PurchaseRequest SET Status = AWARDED;
COMMIT
  Compensation: N/A (Atomic Rollback if fails).
  Timeout: 5000ms.
AFTER COMMIT (Async/Events):
  1. Emit `QuotationAwardedEvent`.
```

## TASK 7: Aggregate Verification
### Aggregate: `PurchaseRequest`
- **Can another Aggregate reference it?** Yes, by `requestId` (UUID) only. No direct DB Join allowed.
- **Can another Aggregate modify it?** No. Only `RequestService` can modify it.
- **Can another Aggregate delete it?** No.
- **Can another Aggregate create children?** No. (No direct inserts to `PurchaseRequestItem`).
- **Allowed navigation:** PR -> Items. Items cannot navigate back to PR via DB ORM relations outside the repository.
- **Allowed lifecycle:** DRAFT -> PUBLISHED -> AWARDED -> CLOSED.

## TASK 8: API Contracts
### API: `POST /api/procurement/requests`
- **Input DTO:** `{ title: string, items: [{ productId, qty }] }`
- **Output DTO:** `{ id: UUID, status: DRAFT, createdAt: string }`
- **Errors:** `400 BAD_REQUEST (Invalid Items)`, `401 UNAUTHORIZED`.
- **Authorization:** Requires `Buyer` role context.
- **Idempotency:** Required (Header: `X-Idempotency-Key`).
- **Validation Rules:** Items > 0. Qty > 0.
- **Version:** `v1`

## TASK 9: Database Migration Strategy
### Phase 1: Aggregate Isolation (e.g. PurchaseRequest)
- **Phase:** Dual-Write & ACL setup.
- **Old Structure:** Direct mutation via random controllers.
- **New Structure:** Encapsulated in `PurchaseRequestRepository`.
- **Compatibility Layer:** Expose temporary local facade for legacy controllers.
- **Rollback:** Disable feature flag, fallback to direct ORM mutation.
- **Data Migration:** None required for this phase (Logic change only).
- **Feature Flag:** `ENABLE_NEW_PR_AGGREGATE`.
- **Cutover:** Route all `req` traffic to new Domain Service.
- **Cleanup:** Delete legacy ORM calls and child repositories.

## TASK 10: Measurable Architecture Metrics (KPIs)
The architecture is only accepted if these metrics improve across Sprints:
- **Maximum Aggregate Size:** < 50 child entities per root (Protects RAM/DB Locks).
- **Maximum Transaction Duration:** < 50ms.
- **Maximum Synchronous Cross-Domain Calls:** 0 (Strictly Pub/Sub or ACL caches).
- **Maximum Event Latency:** < 500ms (Publish to Consume).
- **Coupling Score (Incoming FKs across domains):** Must decrease by 80%.
- **Repository Count:** Must equal exact number of Aggregate Roots (Reduction of ~40%).
- **Service Count:** Aligned 1:1 with Business Capabilities.
