# 🛡️ Sovereign Phase 3: Smart Auto-Replenishment System (SARS)

## System Design Document (SDD)

**Project:** SOVEREIGN  
**Status:** DRAFT (Phase 3 Initial)  
**Security Level:** TOP SECRET (AES-256-GCM Mandated)

---

### 1. Executive Summary

The **Smart Auto-Replenishment System (SARS)** is designed to close the procurement loop by automatically initiating supply requests when inventories reach the `reorderPoint`. It eliminates human delay while maintaining strict sovereign price controls and negotiation boundaries.

### 2. Core Architecture Components

#### (A) The Trigger Component (`ReplenishmentTrigger`)

- **Integration**: Hooked into `InventoryAlertService`.
- **Logic**: If `currentStock <= reorderPoint` AND `autoReplenishEnabled === true`.
- **Performance**: Evaluation time < 10ms.

#### (B) Supplier Selection Engine (`SupplierQualificationService`)

- **Filters**:
  1.  **Sector Match**: Must be in the same `categoryId`.
  2.  **Rating Audit**: Minimum 4.0/5.0 seller rating.
  3.  **Historical Integrity**: Sellers who have successfully fulfilled deals at prices within the Sovereign cap (avgPrice + 10%).
- **Constraint**: Selects the top 3 optimal sellers to avoid resource exhaustion.

#### (C) Internal Negotiation Engine (`AutoNegotiationEngine`)

- **Algorithm**: "Sovereign Ceiling Negotiation".
- **Rule 1**: Starting bid = Historical Avg Price.
- **Rule 2**: Maximum counter = Historical Avg + 10%.
- **Rule 3**: Timeout = 24 hours. If no agreement, escalate to Manual Procure.
- **Logic**: No external AI. Pure deterministic rules based on `PriceQuote` history.

### 3. Encryption Map (SARS Data)

| Field                 | Storage Type | Encryption  | Rationale                            |
| --------------------- | ------------ | ----------- | ------------------------------------ |
| `negotiationLog`      | `JSONB`      | AES-256-GCM | Protects strategic bid patterns      |
| `targetPrice`         | `DECIMAL`    | AES-256-GCM | Conceals buyer's budget ceiling      |
| `supplierTerms`       | `TEXT`       | AES-256-GCM | Protects supplier industrial secrets |
| `replenishmentStatus` | `STRING`     | Plaintext   | Searchable for dashboard tracking    |

### 4. Sequence Flow

1.  `recordSale` -> `InventoryAlertService` detects stock level < `reorderPoint`.
2.  Check for existing active Replenishment Order (Prevent duplicate spam).
3.  `SupplierQualificationService` identifies 3 candidates.
4.  `AutoNegotiationEngine` creates internal "Ghost Requests" (Draft state).
5.  Notifies candidates via encrypted channels.
6.  Auto-accepts the first bid that meets the **Sovereign Ceiling**.

### 5. Fallback Plan (Contingency)

1.  **Price Violation**: If no supplier stays under +10%, sys-locks the auto-order and notifies the Sovereign Auditor.
2.  **No Responses**: If no bids in 24h, converts the auto-order to a "Public High-Urgency PurchaseRequest".
3.  **Memory Leak**: If internal process exceeds 100MB, the `MemoryWatchdog` kills the thread and restarts procurement in manual mode.

---

**Sovereign Auditor Approval Required**
_(c) 2026 Project SOVEREIGN_
