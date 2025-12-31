# ADR 002: Delegation Architecture & Invariants (Phase 4)

## Status
ACCEPTED

## Context
We are introducing a "Delegation" system (Phase 4) to allow users (Actors) to act on behalf of other users (Principals). This adds complexity to the Authorization layer. We must define strict boundaries to prevent security regressions, "split-brain" authorization, or logical loops.

## Decision
We adopt a **Identity-Swap Middleware Pattern** for delegation. The `authorize` middleware is the *only* component aware of delegation semantics.

## Invariants (Non-Negotiable)

### 1. Delegation = Identity Only (Phase 4.0)
- The current implementation swaps the "Authenticated User" (`req.user`) with the "Principal".
- **Phase 4.0** does NOT enforce granular permissions or scopes defined in the `Delegation` table. If a delegation exists and is active, it grants full "Identity Masquerading".
- **Phase 4.1** (Future) will enforce `permissionKey` and `scopeType`.

### 2. Owner Bypass on Actor
- The `OWNER_ID` (Platform Root/Admin) check must inspect the **ACTOR** (`req.auth.actor`), not the **PRINCIPAL**.
- Reason: The Platform Owner is a technical entity. If they are impersonating a user for support, they are still the Owner. If a random user impersonates the Owner (impossible via logic, but theoretically), they do not become the Owner.
- **Rule**: `if (req.auth.actor.id === process.env.OWNER_ID) return next();`

### 3. No Nested Delegation
- Delegation is single-hop only.
- An Actor cannot delegate their acting authority to another.
- **Rule**: `Actor != Principal` (Self-delegation is redundant/invalid).
- **Rule**: Attempting to "Act As" someone while already "Acting As" someone (if we supported chain headers) is strictly forbidden.

### 4. Policies Remain Delegation-Agnostic
- **Strict Prohibition**: No Policy (`*Policy.js`) shall ever inspect `req.auth`, `req.realUser`, or `delegation` context.
- Policies must only inspect `user` (which middleware has guaranteed is the Principal) and `resource`.
- This ensures Policies are "Pure" and unaware of the complexity of how the user arrived there.

### 5. Services Never Know Delegation Exists
- Service layer methods must NOT accept `actor` or `delegation` arguments separate from the business logic requirements (e.g. `auditActor` is fine for logging, but not for logic).
- Services operate on the data provided, unaware of the authorization context.

## Consequences
- **Positive**: Clean separation of concerns. Policies don't need refactoring. Centralized security logic.
- **Negative**: `authorize.js` becomes a critical "Security Kernel". Any bug there impacts the entire system. Testing this middleware is paramount.

### 6. Testing Invariants
- **Role usage in Test Mocks**: While unit tests (e.g., `QuotePolicy.test.js`) may define objects with `role` properties (e.g., `const user = { role: 'seller' }`), this is purely for descriptive mocking or legacy compatibility in tests.
- **Strict Rule**: The Policy Logic itself must **NOT** rely on `user.role` for authorization decisions. It must rely on `user.id`, `user.context`, and relationship to `resource`. RBAC (Middleware) handles role-based access before Policy is reached.
