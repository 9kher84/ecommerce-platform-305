# ADR-008: Transactional Outbox & Inbox Pipeline

**Status**: Accepted  
**Date**: 2026-07-19  

## Context and Problem Statement

In our microservices/modular monolith architecture, ensuring consistency between local database updates and published domain events is critical. Dual writes (writing to the database and then publishing to an event bus) are prone to failures—if the application crashes after the database commit but before the event is published, the event is lost forever, leading to system inconsistencies.

Additionally, when listening to events (Consumer side), network retries or publisher restarts can cause the same event to be delivered multiple times. Processing the same event twice can corrupt business state (e.g., deducting inventory twice).

## Decision

We have adopted the **Transactional Outbox Pattern** combined with the **Inbox Pattern (Idempotent Consumer)**.

### 1. The Outbox Pattern (Publisher Side)
- Instead of publishing directly to the event bus, the `UnitOfWork` saves events to an `OutboxEvents` table within the **same database transaction** as the business entity changes.
- This guarantees atomicity: if the business transaction fails, the event is rolled back. If it succeeds, the event is guaranteed to be saved.
- A background worker (`OutboxDispatcher`) continuously polls the `OutboxEvents` table for `PENDING` events.
- To handle concurrency across multiple worker instances, the dispatcher uses `SELECT ... FOR UPDATE SKIP LOCKED` (PostgreSQL/MySQL 8+) to claim a batch of events atomically without blocking other workers.

### 2. The Inbox Pattern (Consumer Side)
- To guarantee exactly-once processing, each consumer (Policy) records the event ID it has processed in an `InboxEvents` table.
- We use a composite unique constraint `(eventId, consumerName)`.
- If an event is delivered twice, the second attempt will throw a `UniqueConstraintError` when trying to insert into the Inbox, allowing us to safely skip the duplicate processing.

## Failure Matrix

The system is designed to recover gracefully from various failure scenarios.

| Failure Scenario | Expected System Behavior |
| :--- | :--- |
| **API crashes before DB commit** | The transaction rolls back. No `OutboxEvents` row is saved. The system remains consistent. |
| **API crashes after DB commit** | The `OutboxEvents` row is saved safely. The independent `worker.js` dispatcher will pick it up and publish it shortly after. |
| **Dispatcher crashes after publish but before ACK** | The event remains in `PROCESSING` status. After the processing timeout (e.g., 5 mins), another worker will re-claim it and publish it again. The **Inbox** on the consumer side will catch the duplicate and safely ignore it. |
| **Database becomes unavailable** | The dispatcher will fail to claim or publish. It will pause and retry on the next interval. Once the DB recovers, it resumes. |
| **Worker process is restarted/killed** | Another worker node will automatically take over `PENDING` events. Events stuck in `PROCESSING` by the killed worker will be reclaimed after the timeout. |
| **Consumer Policy throws an error** | The dispatcher catches the error and marks the Outbox event as `FAILED`. It schedules a retry using an **Exponential Backoff** strategy. |
| **Consumer Policy fails repeatedly** | After `MAX_RETRIES` (e.g., 5 times), the event status is changed to `DEAD_LETTER`. It will no longer be retried automatically and requires manual operator intervention. |

## Standard Operating Procedure: Adding a new Policy

When creating a new policy that reacts to a Domain Event, you do not need to worry about idempotency logic inside your policy.

1. Create your Policy class (e.g., `SendWelcomeEmailPolicy`).
2. Wrap it using `PolicyExecutionMiddleware.wrap('SendWelcomeEmailPolicy', yourPolicyFn)`.
3. Register the wrapped policy with the EventBus.

The `PolicyExecutionMiddleware` will automatically handle the Inbox check, ensure the policy runs within its own transaction, and silently skip if the event was already processed by `SendWelcomeEmailPolicy`.

## Observability & Retention

- **Metrics**: The `OutboxMetrics` class tracks throughput, retries, and dead letters. These are exposed via the `/health` endpoint on `worker.js`.
- **Cleanup**: To prevent unbounded growth of the Outbox table, the `OutboxRetentionJob` runs periodically to archive/delete `PUBLISHED` events older than 30 days, and `DEAD_LETTER` events older than 180 days.
