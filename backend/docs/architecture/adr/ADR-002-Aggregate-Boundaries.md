# ADR 002: Aggregate Boundaries
**Date:** 2026-07-18
**Status:** DRAFT (Pending Architecture Review)
**Owner:** Architecture Governance Team

## 1. Context & Problem Statement
Data mutations currently span multiple tables without strict consistency boundaries, leading to partial failures and invalid business states (e.g., modifying `PurchaseRequestItem` directly without validating the parent `PurchaseRequest` status). We must define strict transactional boundaries (Aggregates).

## 2. Alternatives Considered
- **Option A (Small Aggregates):** Every single table is an Aggregate Root. *Rejected. Leads to complex eventual consistency for things that must be strongly consistent (like a Request and its Items).*
- **Option B (Domain-Level Aggregates):** The entire Domain is one Aggregate. *Rejected. Impossible to scale, locks entire tables, high contention.*
- **Option C (True DDD Aggregates):** An Aggregate Root controls a small cluster of tightly coupled entities and enforces Invariants. *Accepted.*

## 3. Decision
- Only **Aggregate Roots** may be loaded or saved via Repositories.
- Child entities (e.g., `QuotationItem`) can only be modified through their Root (`Quotation`).
- Cross-aggregate updates MUST be asynchronous (Domain Events) or span multiple transactions managed by a Saga, never a single DB transaction.

## 4. Consequences
- **Positive:** Zero partial failures for business rules. Data is always perfectly consistent within an aggregate.
- **Negative:** Repositories will need to be refactored to fetch entire aggregates, which might require adjusting GraphQL resolvers or API outputs.

## 5. Traceability
- **Business Rule:** "A Purchase Request cannot be published without items."
- **Implemented By:** Aggregate Catalog (W1_02).
- **Verified By:** Future Repository Refactoring (Wave 2).
