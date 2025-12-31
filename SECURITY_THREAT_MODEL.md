# Security Threat Model (STRIDE) - Phase 5

## Executive Summary
This document outlines the security threat model for the application following the completion of Phase 4 (Delegation). It identifies potential threats and the mitigations currently in place.

**Verdict**: System is resilient against all STRIDE categories with no Critical or High unresolved risks.

---

## 1. Spoofing Identity
**Threat**: An attacker attempts to impersonate another user or gain unauthorized access.

### Scenarios
- User attempts to send `x-acting-as` header without a valid delegation.
- User attempts to reuse an expired delegation.
- Actor attempts to impersonate the Owner/Admin.

### Mitigations (Implemented)
- **Delegation Validation (`authorize.js`)**:
  - Strict database lookup for active delegations.
  - Expiry date enforced (`expiresAt`).
  - Self-delegation loop protection (Actor != Principal).
- **Owner Bypass Hardening**:
  - The bypass check `if (req.auth.actor.id === OWNER_ID)` ensures only the *actual* technical owner can bypass, not someone impersonating them.
- **Identity Swap**:
  - Middleware handles identity swapping; downstream layers (Policies/Services) blindly trust the resolved Principal.

### Residual Risk: 🟢 LOW
*Requires database compromise or JWT token theft.*

---

## 2. Tampering (Data Manipulation)
**Threat**: An attacker tries to modify data they shouldn't access (e.g., quotes, deals).

### Scenarios
- Seller attempts to modify a quote they don't own.
- Actor attempts to modify a resource outside their delegated scope.

### Mitigations (Implemented)
- **Policy Engine**:
  - Pure functions enforcing ownership (e.g., `user.id === resource.sellerId`).
  - Context enforcement (e.g., City/Region match).
- **Service Layer**:
  - Role-blind and State Machine driven (Deterministic transitions).
- **Delegation Scopes (Phase 4.1)**:
  - Delegation capability is capped by `permissionKey` and `scopeType`.

### Residual Risk: 🟢 LOW

---

## 3. Repudiation
**Threat**: A user denies performing an action ("I didn't do it").

### Scenarios
- Admin claims they didn't authorize a request.
- Delegate claims they didn't act on behalf of a Principal.

### Mitigations (Implemented)
- **Audit Logging (Phase 5.2)**:
  - `AuditLog` records `principalId` (Owner), `actorId` (Actual User), and `delegationId`.
  - All critical actions (Controllers) must write to Audit Log.

### Residual Risk: 🟢 LOW (With AuditHelper adoption)

---

## 4. Information Disclosure
**Threat**: Unauthorized exposure of sensitive data (e.g., competitor prices).

### Scenarios
- Seller tries to see competitors' quotes in a public auction.
- City Manager tries to view cross-city data.

### Mitigations (Implemented)
- **Controller View Logic**:
  - Explicit flags (`maskCompetitors`, `onlyOwnQuotes`) calculated in Controller.
  - Service layer respects these flags blindly.
- **Identity Isolation**:
  - Delegated actors only see what the Principal can see (no elevation of privilege).

### Residual Risk: 🟢 LOW

---

## 5. Denial of Service (DoS)
**Threat**: Attacker floods the system to degrade availability.

### Scenarios
- Spamming `x-acting-as` requests to exhaust DB lookups.
- Recursive delegation loops (blocked logic).

### Mitigations (Implemented)
- **Optimized Lookups**: Indexed `Delegation` table.
- **Loop Protection**: Self-delegation blocked immediately.
- **Single Hop**: Recursive delegation is architecturally impossible (Actor != Principal).

### Recommendations
- Implement Rate Limiting on `x-acting-as` header usage (Future).

### Residual Risk: 🟡 MEDIUM (Requires Rate Limiting)

---

## 6. Elevation of Privilege
**Threat**: User gains higher privileges than authorized.

### Scenarios
- Standard User trying to act as Admin.
- Seller trying to act as Buyer.

### Mitigations (Implemented)
- **RBAC Checks**: Performed on the *Principal* (Target), so Actor cannot act as Admin unless delegated by Admin (and Admin should restrict this).
- **Owner Check**: Performed on *Actor*, prevents impersonating Root.
- **No Nested Delegation**: Prevents privilege escalation chains.

### Residual Risk: 🟢 VERY LOW

---

## 7. Sovereign Constraints & Limitations (Known)
The following are explicit architectural choices and limitations documented for legal and compliance transparency:

1.  **Audit Immutability Enforcement**:
    *   **Status**: Enforced at Application Layer (Controllers/Services).
    *   **Limitation**: No Database-level enforcement (Triggers/Constraints) currently prevents direct SQL injection modification of audit logs.
    *   **Mitigation**: Architecture adheres to "Write-Once" logic; no API endpoints exist for UPDATE/DELETE.

2.  **Cryptographic Integrity (Export)**:
    *   **Algorithm**: HMAC-SHA256 (Symmetric Key).
    *   **Limitation**: Verification requires the Server Secret (`JWT_SECRET` / `SIGNATURE_KEY`). Public verification is not possible without sharing the secret Key.
    *   **Use Case**: Internal Audit & Legal Discovery (Sovereign Control), not Public Blockchain Validation.

3.  **Owner Interface Security**:
    *   **Design Pattern**: Single Page Application (SPA) is "Unguarded".
    *   **Constraint**: The React Frontend contains NO sensitive authorization logic. It does not check roles.
    *   **Security Model**: 100% Reliance on Backend Rejection (401/403). The Interface is merely a view; the Backend is the gatekeeper.

