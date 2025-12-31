# Implementation Plan - Week 1: Identity & Access Control

**Objective:** Secure authentication by moving tokens to HttpOnly cookies, implementing strict token validity, and enforcing rotation for refresh tokens.

## Phase 1: Analysis
- [ ] **Audit Current Auth Flow**:
    - [ ] Review `authController.js` (login, refreshToken functions).
    - [ ] Review `authMiddleware.js` (token verification).
    - [ ] Check `utils/generateToken.js` (or equivalent).
- [ ] **Check Dependencies**:
    - [ ] Verify if `cookie-parser`, `uuid`, `ioredis` (or `redis`) are installed.
- [ ] **Database Inspection**:
    - [ ] Check existing `User` model for integration points.
    - [ ] Confirm database type (PostgreSQL) for `refresh_tokens` table.

## Phase 2: Implementation

### 1. JWT Hardening
- [ ] **Install Dependencies**: `npm install cookie-parser uuid` (if missing).
- [ ] **Configure Redis**: Ensure Redis connection is ready for Blacklist.
- [ ] **Update Token Generation**:
    - [ ] Generate `jti` (UUID).
    - [ ] Set Access Token Expiry to `15m`.
    - [ ] Set Refresh Token Expiry to `30d`.
- [ ] **Update Login Response**:
    - [ ] Remove tokens from JSON body (or keep only Refresh Token if not cookie-based yet, but plan says "HttpOnly").
    - [ ] Set `access_token` as `HttpOnly Secure SameSite=Strict` cookie.
- [ ] **Implement Logout**:
    - [ ] Decode token, extract `jti`.
    - [ ] Add `jti` to Redis Blacklist with TTL = `exp - now`.
    - [ ] Clear Cookie.
- [ ] **Update Auth Middleware**:
    - [ ] Read token from Cookie first.
    - [ ] Verify signature.
    - [ ] Check Redis Blacklist for `jti`.

### 2. Refresh Token Rotation
- [ ] **Database Schema**:
    - [ ] Create `refresh_tokens` table:
      ```sql
      CREATE TABLE refresh_tokens (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        device_id TEXT,
        jti TEXT UNIQUE NOT NULL,
        revoked BOOLEAN DEFAULT FALSE,
        created_at TIMESTAMP DEFAULT now(),
        last_used_at TIMESTAMP,
        expires_at TIMESTAMP NOT NULL
      );
      ```
    - [ ] Add Sequelize Model `RefreshToken`.
- [ ] **Update Login Logic**:
    - [ ] Create new `RefreshToken` record on login.
- [ ] **Update Refresh Endpoint**:
    - [ ] Accept old Refresh Token.
    - [ ] Transaction:
        - [ ] Find token in DB (Lock row).
        - [ ] Validate: exists, !revoked, !expired.
        - [ ] Revoke old token (`revoked = true`).
        - [ ] Detect Reuse: If already revoked, **Security Alert** & Revoke *all* user tokens.
        - [ ] Create *new* Refresh Token (New `jti`, New DB Row).
        - [ ] Return new tokens (Set Cookie).
- [ ] **Periodic Cleanup**:
    - [ ] (Optional for now) Cron job to delete expired tokens.

## Phase 3: Verification
- [ ] **Automated Tests**:
    - [ ] **Test 1 (Login):** `curl` login -> Verify `Set-Cookie` header present, access_token not in body.
    - [ ] **Test 2 (Access):** `curl` protected route with cookie -> 200 OK.
    - [ ] **Test 3 (Logout):** `curl` logout -> Verify Cookie cleared. Redis check for `jti`.
    - [ ] **Test 4 (Replay):** `curl` protected route with blacklist token -> 401 Unauthorized.
    - [ ] **Test 5 (Refresh):** `curl` refresh -> Get new token. Old token marked revoked in DB.
    - [ ] **Test 6 (Refresh Replay):** `curl` refresh with old token -> 401 & "Reuse Detected" log.

## Rollback Plan
- [ ] Keep `access_token` in response body temporarily if frontend breaks (Plan B).
- [ ] Disable Redis check if Redis fails (Fail-open or Fail-closed decision? -> Fail-closed for security).
