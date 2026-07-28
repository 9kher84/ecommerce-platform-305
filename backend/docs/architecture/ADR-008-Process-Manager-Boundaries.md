# ADR-008: Process Manager Boundaries

**Status:** Accepted
**Date:** 2026-07-19

## Context
As we migrate towards a fully Event-Driven Architecture, we need a mechanism to coordinate long-running processes or workflows that span multiple Aggregates or Bounded Contexts. For example, when a `Quotation` is accepted, an `Award` must be created. Placing this orchestration logic inside the `Quotation` Use Case violates boundary isolation. Placing it inside the Event Bus creates tightly coupled infrastructure.

## Decision
We introduce the **Process Manager (Policy)** pattern as the designated orchestrator for multi-aggregate workflows. To prevent Process Managers from becoming "God Classes" or leaking business logic, they must adhere to the following boundaries:

- **PM-01: No Domain Business Rules:** Process Managers must not contain Domain Business Rules. They are purely coordinators.
- **PM-02: No Direct Aggregate Mutation:** Process Managers must never modify an Aggregate directly. They must use the Application Layer (Use Cases) to execute commands.
- **PM-03: Event-Driven Orchestration:** Process Managers orchestrate flows exclusively by consuming `DomainEvents` and triggering `UseCases`.
- **PM-04: Idempotency:** Process Managers must be safe to retry/replay. If the same event is received twice, the final state must remain consistent. Query First with Database Unique Constraints is the preferred strategy.
- **PM-05: Restart-Safe:** If the server crashes during execution, or an event is re-delivered, the Policy must recover gracefully without duplicating side effects.
- **PM-06: Process Managers must be stateless:** Process Managers must not persist internal state. They depend purely on the incoming event and external inputs. Any permanent state must be stored inside formal Aggregates or dedicated storage if specifically required for a long-running Saga. This ensures safe replays and horizontal scaling.
- **PM-07: Failure Isolation:** A failure in one Process Manager must not crash the `EventBus` or prevent other handlers from processing the same event.

## Consequences
- **Positive:** Aggregates remain completely unaware of downstream workflows. The Event Bus remains purely infrastructural.
- **Negative:** Adds a new layer of indirection. Troubleshooting requires tracing events through the Policy Registry rather than following a single synchronous call stack.
