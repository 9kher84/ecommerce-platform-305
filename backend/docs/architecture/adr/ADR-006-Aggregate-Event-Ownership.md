# ADR 006: Aggregate Event Ownership (Rule AE-01)

## Status
Accepted

## Context
As we migrate toward a pure Domain-Driven Design (DDD) architecture, we identified a risk where Application Services (Use Cases) might directly instantiate Domain Events (e.g., `new QuotationSubmittedEvent(...)`). This leads to a fragmented domain model where the Aggregate's state transitions are decoupled from the events that represent those transitions. 

If Use Cases manually create events, the Aggregate loses ownership over its own lifecycle, making the system prone to bugs where a state transition occurs without the corresponding event being fired, or vice versa.

## Decision
We establish **Rule AE-01: Aggregate Event Ownership**:
> "Only Aggregates are allowed to create Domain Events. Application Services may dispatch events, but must never instantiate them."

All Domain Events must be instantiated internally within the Aggregate's domain methods using the `addEvent()` method inherited from `AggregateRoot`.

### Correct Implementation:
```javascript
// Inside the Aggregate (e.g., Quotation.js)
submit() {
    this.status = "submitted";
    this.addEvent(new QuotationSubmittedEvent({ aggregate: this }));
}

// Inside the Use Case
quote.submit();
await transactionManager.execute(async (t) => {
    await repo.store(quote, t);
});
quote.pullEvents().forEach(e => EventBus.publish(e));
```

### Incorrect Implementation:
```javascript
// Inside the Use Case (FORBIDDEN)
quote.submit();
await repo.store(quote, t);
const event = new QuotationSubmittedEvent({ aggregate: quote }); // VIOLATION
EventBus.publish(event);
```

## Consequences
- **Positive:** Guarantees that state transitions and their corresponding events are always atomically bundled within the Domain.
- **Positive:** Simplifies Application Use Cases, turning them into pure coordinators.
- **Positive:** Prevents regressions in event-driven side effects.
- **Constraint:** Requires all Aggregates to inherit from `AggregateRoot` and explicitly manage their internal `_domainEvents` array.
