# ADR-011: Event-Driven Boundaries

**Status:** Accepted
**Date:** 2026-07-19

## Context
As we introduce more bounded contexts (Procurement, Sales, Escrow, Payments), we need to ensure that the EDA (Event-Driven Architecture) does not accidentally turn into distributed coupling. If Downstream contexts start querying Upstream contexts to fetch missing data, the architecture becomes fragile and intertwined.

## Decision
We establish the following Event-Driven Integration Rules:

### ED-01: Downstream Aggregates must subscribe only to committed business events.
Aggregates in downstream domains (e.g., Escrow) must never reconstruct commercial agreements by querying upstream aggregates (e.g., Award or PurchaseRequest).
- Downstream domains do not contain Repositories for upstream domains.
- Downstream domains must rely entirely on the data provided in the Domain Event payload.
- Upstream events (e.g., `AwardConfirmedEvent`) must carry a full "Commercial Snapshot" as defined by `AL-03`, ensuring downstream policies have all required context.

## Consequences
- **Positive:** Domains remain completely decoupled. Escrow does not know Procurement exists.
- **Positive:** Enables scaling out specific bounded contexts as separate microservices if required in the future.
- **Negative:** Upstream events carry larger payloads (e.g., explicitly defining both Buyer and Seller IDs in the `AwardConfirmedEvent` rather than relying on an ID lookup).
