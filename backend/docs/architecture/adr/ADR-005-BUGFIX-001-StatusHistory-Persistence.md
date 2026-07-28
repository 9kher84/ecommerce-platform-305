# ADR-005: BUGFIX-001 - StatusHistory Persistence in PurchaseRequest

## Status
Accepted

## Context
During the refactoring of `PurchaseRequest` (Wave 2 Pilot), it was discovered that the legacy implementation contained a bug: when publishing a request, the `statusHistory` array was mutated in memory but never persisted to the database. The legacy code only persisted the `status` field explicitly via `PurchaseRequest.update({ status: ... })`.

To respect **Rule Zero** (No Behavior Changes during Refactoring), Phase A of the Pilot deliberately cloned this bug to ensure the Golden Master passed 100%. The architectural transformation from procedural controllers to pure DDD Aggregates was verified against this baseline.

## Decision
Now that the Golden Template is mathematically proven (Phase A), we are initiating **Phase B: Specification Change**.
We have intentionally changed the system behavior to correctly persist the `statusHistory` array to the database within a transaction boundary. 

1. `PurchaseRequestRepository.store` has been updated to include `statusHistory` in the `updateData` payload.
2. The `PurchaseRequest.update` call is now safely wrapped in a Sequelize Transaction to guarantee atomicity.
3. The original `Golden Master Test` has been retired and replaced by a `Specification Test` that strictly asserts the *correct* behavior (persisting `statusHistory` and utilizing transactions).

## Consequences
- **Positive:** System state accuracy is restored. Historical audits of `PurchaseRequest` transitions will now correctly be recorded in the database.
- **Positive:** EventBus side-effects (e.g. notifications) are fired only *after* the transaction successfully commits.
- **Negative:** None.

## Notes
This ADR formally marks the completion of the `PurchaseRequest` Golden Template. This Pilot may now be safely replicated across other Aggregates (e.g. `Quotation`, `Deal`) without inheriting the legacy persistence bug.
