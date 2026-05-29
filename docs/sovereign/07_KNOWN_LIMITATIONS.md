# 7. Known Limitations & Operational Constraints

_As of v1.0 Release_

## 1. Database Immutability

- **Constraint**: Immutability is enforced by the Application Layer (Node.js).
- **Risk**: A database administrator (DBA) with direct SQL access could theoretically modify logs.
- **Mitigation**: Strict access control to the Database.

## 2. Symmetric Cryptography

- **Constraint**: Audit Logs are signed with `HMAC-SHA256` (Symmetric).
- **Risk**: Verification requires the same secret used for signing. Cannot be verified by a 3rd party without sharing the root key.
- **Mitigation**: Sufficient for internal legal defense and board review.

## 3. Owner Analytics

- **Constraint**: No behavioral tracking (Google Analytics, etc.) installed on the Owner Panel to preserve privacy/security.
- **Risk**: Harder to optimize UX based on usage data.
- **Mitigation**: Rely on direct feedback and basic server-side access logs.
