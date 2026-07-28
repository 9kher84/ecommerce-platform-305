# ADR-010: Escrow Lifecycle & State Machine

**Status:** Accepted
**Date:** 2026-07-19

## Context
With the introduction of the Escrow Bounded Context to secure funds between Buyers and Sellers, we must define the strict state machine governing the lifecycle of an Escrow account. Escrow should purely govern the release of funds and acts independently of payment gateway mechanics.

## Decision
The `Escrow` aggregate will enforce the following State Machine and Rules:

### Allowed Transitions
```text
pending_funding
        │
        ├──► funded ──► released
        │       │
        │       └──► refunded
        │
        └──► cancelled
```

### ES-01: Terminal States
The states `released`, `refunded`, and `cancelled` are Terminal States.
Once an Escrow reaches a terminal state, **no further state transitions are permitted**.

### ES-02: Payment Gateway Isolation
The `Escrow` aggregate does NOT contain logic for Stripe, HyperPay, or any external gateway. It only cares if it has been conceptually `funded` or `refunded` via its domain methods. A separate `Payment` aggregate will be responsible for gateway interactions and will publish an event to transition the Escrow.

## Consequences
- **Positive:** Clean bounded context dedicated to B2B funds security.
- **Positive:** We can change payment gateways in the future without modifying the Escrow aggregate.
