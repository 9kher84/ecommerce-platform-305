# Security Hardening Roadmap

This document tracks the execution of the comprehensive security hardening plan.

## Week 1: Identity & Access Control (Part A)
- [ ] **1. JWT Hardening**
    - [ ] Issue tokens with `jti`, `iat`, `exp`.
    - [ ] Reduce Access Token validity to 15m.
    - [ ] Store Access Token in `HttpOnly Secure SameSite=Strict` cookie.
    - [ ] Implement Redis Blacklist for revoked tokens (logout/password change).
    - [ ] Validated: Login sets cookie, LocalStorage empty, Logout invalidates token.
- [ ] **2. Refresh Token Rotation**
    - [ ] Create `refresh_tokens` DB table.
    - [ ] Implement rotation logic (One-time use, sliding window).
    - [ ] Bind tokens to `device_id`.
    - [ ] Implement reuse detection (revoke all descendants).
    - [ ] Validated: Reuse attempts fail and trigger alerts.

## Week 1: File Security (Part B)
- [ ] **5. File Upload Pipeline**
    - [ ] Implement Quarantine (local/S3).
    - [ ] Integrate ClamAV scanning.
    - [ ] Implement Image Stripping/Re-encoding (Pixel-rewrite).
    - [ ] Serve via Signed URLs.
    - [ ] Validated: Malware rejected, Metadata stripped.

## Week 2: API Protection
- [ ] **4. GraphQL Hardening**
    - [ ] Implement Depth Limit (e.g., max 6).
    - [ ] Implement Complexity Analysis.
    - [ ] Add Per-Resolver Authorization.
    - [ ] Validated: Deep queries rejected.
- [ ] **7. Rate Limiting & DOS Mitigation**
    - [ ] Configure Nginx global limits.
    - [ ] Implement App-level Per-Endpoint limits (Redis).
    - [ ] Validated: Load test verifies limits.
- [ ] **13. ORM Security**
    - [ ] Audit for Raw SQL/Concatenations.
    - [ ] Enforce Parameterized Queries.
    - [ ] Validated: CI scan confirms no raw SQL.

## Week 3: Database & Data Safety
- [ ] **6. Race Condition Handling**
    - [ ] Implement DB Transactions for state changes.
    - [ ] Use `SELECT FOR UPDATE` or Optimistic Locking.
    - [ ] Validated: Concurrent requests handled correctly.
- [ ] **3. Password Hashing Upgrade**
    - [ ] Increase bcrypt rounds to 12.
    - [ ] (Optional) Migrate to Argon2id.
    - [ ] Implement Re-hashing on login.
    - [ ] Validated: New hashes created, login speed acceptable.

## Week 4: Administration & Secrets
- [ ] **9. Admin Hardening**
    - [ ] Enforce 2FA for Admin roles.
    - [ ] Separate Admin Domain/Path.
    - [ ] Implement Immutable Audit Logs (DB + S3).
    - [ ] Validated: Admin login requires 2FA, logs are tamper-evident.
- [ ] **10. Secrets Management**
    - [ ] Migrate secrets to Vault/Secrets Manager (or secure env injection).
    - [ ] Implement Rotation.
    - [ ] Validated: No secrets in code/repo.
- [ ] **11. Centralized Logging**
    - [ ] Implement `X-Request-ID` tracing.
    - [ ] Ship logs to ELK/Opensearch.
    - [ ] Validated: Traces visible in central dashboard.

## Week 5: Operations & Caching
- [ ] **15. Monitoring & Alerting**
    - [ ] Setup Exporters (Node, Postgres, Redis).
    - [ ] Define Alert Rules (Latency, Errors, Saturation).
    - [ ] Create Runbooks.
    - [ ] Validated: Simulated failure triggers alert.
- [ ] **8. Redis Cache Security**
    - [ ] Implement Namespacing & TTL.
    - [ ] Implement Pub/Sub Invalidation.
    - [ ] Validated: DB updates invalidate cache.
- [ ] **14. Session Management**
    - [ ] Store Sessions in Redis.
    - [ ] Implement Device Binding & Revocation UI.
    - [ ] Validated: Can revoke specific device session.

## Week 6: Infrastructure Security
- [ ] **16. SSRF Protection**
    - [ ] Implement Allow-list for outbound requests.
    - [ ] Block Private IP ranges.
    - [ ] Validated: Access to localhost/metadata blocked.
- [ ] **17. Supply Chain Security**
    - [ ] Enforce `npm ci` and pinned versions.
    - [ ] Add `npm audit` to CI pipeline.
    - [ ] Validated: Build fails on critical vulnerabilities.
- [ ] **12. Nginx Hardening**
    - [ ] Enable HSTS & Security Headers.
    - [ ] Disable Autoindex & Protect Uploads.
    - [ ] Validated: Headers present, direct upload access denied.

## Week 7: Business Logic & Compliance
- [ ] **18. GraphQL Introspection**
    - [ ] Disable Introspection in Production.
    - [ ] Validated: Schema not visible in prod.
- [ ] **19. Fraud Detection**
    - [ ] Implement Device Fingerprinting.
    - [ ] Rule: Block self-trading (same fingerprint).
    - [ ] Validated: Fraudulent trades blocked.
- [ ] **20. Data Retention**
    - [ ] Implement Auto-delete Cron Jobs.
    - [ ] Validated: Old data removed automatically.
