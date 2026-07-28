# Architecture Review Checklist

All Pull Requests introducing a new Aggregate, or modifying an existing one, MUST pass this checklist before being merged. This enforces the **Execution Standard v2.0**.

## Domain Layer (Aggregates & Events)
- [ ] **Pure POJO:** Does the Aggregate contain any ORM imports (e.g., Sequelize)? *(Must be NO)*
- [ ] **State Machine:** Are valid state transitions explicitly defined and enforced in `canTransition()`? *(Must be YES)*
- [ ] **Event Ownership:** Does the Aggregate instantiate its own events using `this.addEvent()`? *(Must be YES)*
- [ ] **Cross-Aggregate Mutation:** Does the Aggregate modify the state of any other Aggregate directly? *(Must be NO)*

## Infrastructure Layer (Repositories & Mappers)
- [ ] **Return Type:** Does the Repository return ONLY the Domain Aggregate (or null)? *(Must be YES)*
- [ ] **Persistence Type:** Does `Repository.store()` accept ONLY the Domain Aggregate? *(Must be YES)*
- [ ] **Optimistic Locking:** Does `Repository.store()` accept `expectedVersion` and throw `ConcurrencyException` if rows affected are 0? *(Must be YES)*
- [ ] **Mapper Isolation:** Is all mapping between ORM models and Domain Aggregates handled exclusively inside `Mapper` classes? *(Must be YES)*
- [ ] **No Business Logic:** Are there any business rules or validation exceptions thrown from the Repository? *(Must be NO)*

## Application Layer (Use Cases)
- [ ] **Dumb Orchestrator:** Does the Use Case contain any domain validation or state mutation logic? *(Must be NO)*
- [ ] **Transaction Boundary:** Does the Use Case use the `TransactionManager` to explicitly define the transaction boundary? *(Must be YES)*
- [ ] **Event Dispatch:** Does the Use Case pull events from the aggregate AFTER the transaction is committed, and publish them via `EventBus.publish()`? *(Must be YES)*
- [ ] **No Event Instantiation:** Does the Use Case instantiate any `DomainEvent` directly? *(Must be NO)*

## Presentation Layer (Controllers)
- [ ] **No Business Logic:** Does the Controller contain business rules? *(Must be NO)*
- [ ] **Dependencies:** Does the Controller depend on Repositories directly to bypass Use Cases for mutations? *(Must be NO)*

## Verification (Tests)
- [ ] **Specification Tests:** Does the PR include Specification tests mocking the database and executing the full Controller -> Use Case -> Aggregate flow? *(Must be YES)*
- [ ] **Concurrency Tests:** Is there a test ensuring `ConcurrencyException` is thrown when an optimistic lock fails? *(Must be YES)*
- [ ] **Version Integrity Tests:** Is there a test ensuring the aggregate's version maps correctly to the emitted Event? *(Must be YES)*
