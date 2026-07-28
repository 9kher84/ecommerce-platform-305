# ADR 007: Repository Contracts (Rule AR-01 to AR-04)

## Status
Accepted

## Context
In order to prevent ORM-specific models (like Sequelize objects) from leaking into the Application layer (Use Cases) or the Domain Layer, we must strictly define the boundary of the `Repository` pattern. 

If repositories return ORM objects or generic Data Transfer Objects (DTOs), the domain logic becomes coupled to the database schema, violating the core principles of Domain-Driven Design (DDD).

## Decision
We establish **Rule AR-01 to AR-04: Repository Contracts**:

- **Rule AR-01: Repository returns Aggregates only.** A repository must never return a Sequelize Model, a plain DTO, or unstructured data. All read operations (e.g., `findById`) must map the database rows directly into the strongly-typed Domain Aggregate.
- **Rule AR-02: Repository persists Aggregates only.** A repository must accept only the Domain Aggregate for persistence (e.g., `store(aggregate, expectedVersion, transaction)`).
- **Rule AR-03: Repository is responsible for mapping only.** Inside the repository, Mappers are used to translate between Domain Aggregates and ORM Persistence Data.
- **Rule AR-04: Repository never contains business decisions.** A repository must never throw a Domain Rule Exception or manipulate the state of the entity. It solely saves and retrieves state, raising infrastructure-level errors (like `ConcurrencyException`).

## Consequences
- **Positive:** Guarantees absolute separation between the Domain Model and the Persistence Model.
- **Positive:** Application Use Cases remain unaware of the database engine (Sequelize, raw SQL, etc.).
- **Constraint:** Requires strict creation and maintenance of `Mappers` (e.g., `QuotationMapper`) for every Aggregate.
