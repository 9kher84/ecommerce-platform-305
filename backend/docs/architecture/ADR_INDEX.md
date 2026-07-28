# Architecture Decision Index (ADRs)

| ADR | Title | Status | Description |
|---|---|---|---|
| [ADR-001](./adr/ADR-001-Domain-Ownership.md) | Domain Ownership | **Accepted** | Establishes the separation of pure domain logic from infrastructure by introducing independent aggregate files. |
| [ADR-002](./adr/ADR-002-Aggregate-Boundaries.md) | Aggregate Boundaries | **Accepted** | Defines clear transaction boundaries and prohibits cross-aggregate mutations in a single transaction. |
| [ADR-003](./adr/ADR-003-Shared-Kernel.md) | Shared Kernel | **Accepted** | Extracts common base classes (`AggregateRoot`, `DomainEvent`, `DomainException`) to a shared package for reuse. |
| [ADR-004](./adr/ADR-004-Event-Driven-Integration.md) | Event-Driven Integration | **Accepted** | Introduces `EventBus` to handle cross-aggregate integration asynchronously without tight coupling. |
| [ADR-005](./adr/ADR-005-BUGFIX-001-StatusHistory-Persistence.md) | BUGFIX-001 StatusHistory Persistence | **Accepted** | Documents intentional replication of a legacy bug into the Golden Master, fixed via formal Specification in later phase. |
| [ADR-006](./adr/ADR-006-Aggregate-Event-Ownership.md) | Aggregate Event Ownership (Rule AE-01) | **Accepted** | Prohibits Use Cases from instantiating domain events. Only Aggregates can instantiate them. |
| [ADR-007](./adr/ADR-007-Repository-Contracts.md) | Repository Contracts (Rule AR-01..AR-04) | **Accepted** | Defines strict rules for repositories to accept/return Aggregates ONLY, handling mapping via explicit Mapper classes. |
