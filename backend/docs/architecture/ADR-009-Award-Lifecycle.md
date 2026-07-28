# ADR-009: Award Lifecycle & State Machine

**Status:** Accepted
**Date:** 2026-07-19

## Context
With the introduction of the `Award` aggregate to replace the deprecated `Deal` concept, we must define the strict state machine governing the lifecycle of an award. The `Award` acts as the definitive source of truth in the Sales domain, dictating when downstream operations (e.g. Escrow, Payments) can occur.

## Decision
The `Award` aggregate will enforce the following State Machine and Rules:

### Allowed Transitions
```text
accepted
    │
    ├──► confirmed
    │          │
    │          ├──► completed
    │          │
    │          └──► cancelled
    │
    └──► cancelled
```

### AL-01: Terminal States
The states `completed` and `cancelled` are Terminal States.
Once an Award reaches a terminal state, **no further state transitions are permitted**.

### AL-02: Immutable Business Snapshot
Once an Award is created (starts at `accepted`), the business details representing the commercial agreement are **immutable**.
The following fields must never be mutated:
- `lines` (Award Lines: products, quantities, prices)
- `totalAmount`
- `currency`
- `purchaseRequestId`
- `quotationId`
- `sellerOrganizationId`

The only properties that may change after creation are:
- `status`
- `version` (for Optimistic Locking)
- `timestamps`

If any commercial modifications are required after an Award is made, a formal Change Order process or a new Award flow must be initiated; the existing Award itself remains an immutable snapshot of what was initially awarded.

### AL-03: Commercial Snapshot Rule
An Award is the immutable commercial agreement between buyer and seller. It must contain every business attribute required by downstream bounded contexts. Downstream aggregates must never reconstruct the agreement by querying upstream aggregates. This means the Award must explicitly store both the `buyerOrganizationId` and `sellerOrganizationId`.

## Consequences
- **Positive:** Downstream domains (Escrow, Payment) can safely reference the Award's `totalAmount` knowing it will never mysteriously change beneath them.
- **Positive:** Terminal states prevent accidental reopening of historical records.
- **Positive:** Escrow, Payments, and Shipping can subscribe to Award events without needing to join against PurchaseRequests or Quotations to find the involved parties.
- **Negative:** Flexibility is reduced for "quick fixes" to an award's price. A formal Cancellation and re-Award flow is required if a mistake was made.
