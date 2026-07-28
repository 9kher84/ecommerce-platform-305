# ADR-012: Payment Lifecycle

## Status
Accepted

## Context
With the introduction of the Payment Bounded Context (PR-010), we need a rigid state machine to govern the lifecycle of a `Payment` Aggregate. Payments involve external providers (e.g., Stripe, HyperPay, Moyasar), which introduces latency, async webhooks, and potential failures.

To maintain system integrity and follow the Execution Standard, the Aggregate must control all state transitions internally, independent of any specific provider's API.

## Decision

We will implement a standard state machine inside the `Payment` Aggregate. 
The Use Case will interface with a `PaymentGatewayPort` and translate responses into domain method calls (`authorize()`, `capture()`, `fail()`), keeping the Aggregate completely agnostic to the gateway.

### The State Machine

```text
initiated
   │
   ├──► processing
   │       │
   │       ├──► authorized
   │       │       │
   │       │       └──► captured
   │       │
   │       └──► failed
   │
   └──► cancelled
```

### Allowed Transitions & Rules

1. `initiated` ──► `processing`:
   - Triggered when the payment request is sent to the gateway.
2. `processing` ──► `authorized`:
   - Triggered when the gateway reserves the funds on the customer's card (but hasn't charged it yet).
   - Emits `PaymentAuthorizedEvent`.
3. `authorized` ──► `captured`:
   - Triggered when the reserved funds are actually captured.
   - Emits `PaymentCapturedEvent`.
   - **Terminal State**.
4. `processing` ──► `failed`:
   - Triggered when the gateway rejects the payment (e.g., insufficient funds).
   - Emits `PaymentFailedEvent`.
   - **Terminal State**.
5. `initiated` ──► `cancelled`:
   - Triggered if the user cancels the payment before processing begins.
   - Emits `PaymentCancelledEvent`.
   - **Terminal State**.

### PA-01 — External Provider Isolation
The Aggregate must NEVER import or use SDKs like `stripe` or `hyperpay`. The Application Layer (via Ports) handles that.

## Consequences
- Clean separation of business rules and external integrations.
- Easy testing with a `FakePaymentGatewayAdapter`.
- New payment methods can be added by implementing new Adapters without touching the Domain.
