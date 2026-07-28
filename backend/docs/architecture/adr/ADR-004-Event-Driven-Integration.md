# ADR 004: Event-Driven Integration
**Date:** 2026-07-18
**Status:** DRAFT (Pending Architecture Review)
**Owner:** Architecture Governance Team

## 1. Context & Problem Statement
Synchronous cross-domain communication (e.g., Procurement calling Finance API during a checkout flow) creates temporal coupling, leading to cascading failures, slow response times, and complicated distributed transactions.

## 2. Alternatives Considered
- **Option A (REST/RPC everywhere):** Services call each other synchronously. *Rejected. Leads to tight temporal coupling and distributed deadlocks.*
- **Option B (Two-Phase Commit / XA):** Distributed database transactions. *Rejected. Extremely slow, not scalable, anti-pattern in modern architectures.*
- **Option C (Event-Driven Architecture / Choreography):** Domains publish async Events when their state changes. Other domains subscribe and react. *Accepted.*

## 3. Decision
- Inter-domain communication that modifies state MUST be asynchronous via **Domain Events**.
- Events are always named in the past tense (e.g., `DealCompleted`).
- Every event payload MUST include an `EventId` (UUID) and `OccurredAt` timestamp.
- Subscribers MUST implement **Idempotency** (ignoring duplicate `EventId`s).

## 4. Consequences
- **Positive:** Maximum decoupling. If Finance is down, Procurement can still generate Deals.
- **Negative:** Requires an Event Bus (Kafka/RabbitMQ) or Outbox Pattern implementation (Wave 4) to guarantee delivery. State becomes eventually consistent.

## 5. Traceability
- **Business Rule:** "A User should not wait for an email to send before their Quote is accepted."
- **Implemented By:** Domain Events Catalog (W1_04).
- **Verified By:** Future Outbox Implementation (Wave 4).
