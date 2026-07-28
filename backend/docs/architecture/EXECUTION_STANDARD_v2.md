# EXECUTION STANDARD v2.0 (Frozen)

## Overview
This document represents the official and frozen Execution Standard (v2.0) for Domain-Driven Design (DDD) within this ecommerce platform. All new aggregates must strictly adhere to the patterns and rules established here. 

This standard has been proven and battle-tested through the full refactoring and implementation of:
- **Reference Aggregate #1:** `PurchaseRequest`
- **Reference Aggregate #2:** `Quotation`

Any deviation from this standard requires a new Architecture Decision Record (ADR) and a formal version bump to v2.1 or v3.0.

---

## 1. Core Principles

### 1.1. Rule Zero
**"No PR may change behavior and architecture simultaneously."**
Refactoring must purely restructure code without altering business logic. Behavior changes (Bug Fixes, Features) must be done in separate Pull Requests against a stabilized architecture.

### 1.2. Aggregate Boundaries
Aggregates are the single source of truth for business invariants. Cross-aggregate mutation is strictly prohibited. If `Aggregate A` needs to update `Aggregate B`, it must publish a Domain Event, which is later intercepted by a Policy/Process Manager to initiate a separate transaction on `Aggregate B`.

### 1.3. Pure Domain Model
The Domain Layer (Entities, Value Objects, Domain Events, Exceptions) must never contain infrastructure dependencies (ORM, express req/res, API clients).

### 1.4. Application Limits

#### ED-01 — Event-Driven Isolation
Downstream Aggregates must subscribe only to committed business events. No Bounded Context may bypass the EventBus to directly read the Repository of another context to fulfill its creation logic. If an aggregate requires data, that data must be shipped in the Domain Event payload (Snapshot).

#### ED-02 — Events as Committed Business Facts
Events represent committed business facts only. A Policy should rely solely on the self-contained payload of an Event to make its decisions. For example, a `FundEscrowPolicy` must not query the `PaymentRepository` to determine the Payment's status; it must rely entirely on the occurrence of the `PaymentCapturedEvent` and the data within it.

#### PA-01 — External Provider Isolation
No Aggregate, Domain Event, or Domain Service may depend on any external payment provider SDK or API (e.g. Stripe, HyperPay). All provider interaction must occur exclusively through an Application Port (e.g. `PaymentGatewayPort`), and the Use Case translates the gateway's generic response into specific Aggregate state transitions (`authorize()`, `capture()`, `fail()`).

---

## 2. Rule AE: Aggregate Event Ownership
**"Only Aggregates are allowed to create Domain Events. Application Services may dispatch events, but must never instantiate them."**

Aggregates inherit from `AggregateRoot`, which provides the `addEvent(event)` and `pullEvents()` mechanism.

*Real Example (`Quotation.js`):*
```javascript
  withdraw(timestamp) {
    if (!this.canTransition("withdrawn")) {
      throw new DomainViolationException(`Cannot withdraw quotation from '${this.status}' state.`, "INVALID_TRANSITION");
    }

    const previousStatus = this.status;
    this.status = "withdrawn";
    this.withdrawnAt = timestamp;

    this.incrementVersion();
    this.addEvent(new QuotationWithdrawnEvent({ aggregate: this }));

    return { previousStatus, newStatus: this.status };
  }
```

---

## 3. Rule AR: Repository Contracts
**"Repository returns and persists Aggregates only. It is responsible for mapping only, and never contains business decisions."**

Repositories strictly bridge the Domain and Persistence layers. They execute Optimistic Locking using the Aggregate's version.

*Real Example (`QuotationRepository.js`):*
```javascript
  async store(aggregate, expectedVersion, t) {
    const persistenceData = QuotationMapper.toPersistence(aggregate);
    
    if (aggregate.id) {
      // Update existing Quotation with Optimistic Lock
      const [affectedRows] = await Quotation.update(persistenceData.quotation, { 
        where: { 
          id: aggregate.id,
          version: expectedVersion
        }, 
        transaction: t 
      });

      if (affectedRows === 0) {
        throw new ConcurrencyException("Quotation", aggregate.id, expectedVersion, aggregate.version);
      }
      // ... update items ...
    } else {
      // Create logic...
    }
  }
```

---

## 4. Explicit Transactions & Dispatch (Use Cases)
Use Cases are "dumb orchestrators". They do not contain business rules. They open transactions, call the aggregate, save, and publish events.

*Real Example (`WithdrawQuotationUseCase.js`):*
```javascript
  async execute(command) {
    const { quotationId, sellerOrganizationId, timestamp } = command;

    const quote = await this.quotationRepo.findById(quotationId);
    quote.ensureOwnedBy(sellerOrganizationId);
    quote.withdraw(timestamp);

    await this.transactionManager.execute(async (t) => {
      await this.quotationRepo.store(quote, t); 
    });

    quote.pullEvents().forEach(event => {
      EventBus.publish(event);
    });

    return quote;
  }
```

---

## 5. Specification Testing
Once an Aggregate is moved to the DDD Standard, it is tested via **Specification Tests**, not Golden Masters. Specification Tests must run lightning fast without a real database connection (by mocking the Sequelize layer).

Tests must cover:
1. Normal Flow (Success, state transitions, version bumps, event publishing).
2. Domain Invariant Failures (Business exceptions).
3. Concurrency Failures (Optimistic Locking).
4. Version Integrity.

---

## 6. Shared Kernel & Base Classes
The system provides a standardized `Shared Kernel` inside `src/shared/`.
- `AggregateRoot.js`: Base class providing ID, version incrementing, and event queuing.
- `DomainEvent.js`: Base class establishing `eventId`, `aggregateId`, `aggregateVersion`, `occurredAt`, and `eventVersion` for robust async messaging.
- `ConcurrencyException.js`: Standardized Error mapping to HTTP 409.
- `TransactionManager.js`: Decouples Use Cases from specific DB connections.
- `EventBus.js`: Abstract infrastructure port for publishing events.

---

## 7. Reference Implementation Rule (RI-01)
**"New Aggregates must originate from AggregateScaffold. Any deviation from the scaffold must be explicitly justified by a business rule or documented by an ADR."**

- Copy-pasting code between aggregates is strictly prohibited.
- Aggregates must start from `backend/docs/architecture/templates/AggregateScaffold/`.
- This ensures a uniform "Execution Standard v2.0" across all domains and prevents the proliferation of different DDD styles.
