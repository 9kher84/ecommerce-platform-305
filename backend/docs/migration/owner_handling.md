# Owner & Root Access Handling

## Overview

The "Owner" role in this system is a special **Super User** (Root) capability that bypasses all Authorization Logic (RBAC and ABAC / Policies).

## 1. Identification Mechanism

The Owner is identified **exclusively** via the Server Environment Variable:
`process.env.OWNER_ID`

- **Logic**: `middleware/authorize.js` checks `req.user.id === process.env.OWNER_ID`.
- **Constraint**: The legacy `user.isOwner` boolean flag in the database is **IGNORED** by the new authorization system to prevent database-side privilege escalation attacks.

## 2. Interaction with Migration (Phase 2)

During the Phase 2 Migration:

1.  **Role Assignment**: The Owner User (found via ID) will _also_ be assigned the `super_admin` Role in the `UserRoles` table.
    - _Why?_ To ensuring consistent data integrity (every user has a role) and to allow the Owner to test "Standard Admin" flows if they choose to use a secondary account.
2.  **Precedence**: Even with the `super_admin` role assigned, the **Environment Variable Check** takes precedence. The Owner will always return `true` for any permission check, even if the `super_admin` role technically lacks a specific custom permission.

## 3. Security Implications

- **Token Theft**: If the Owner's JWT is stolen, the attacker has Root access.
- **Env Variable Protection**: Access to `process.env` (e.g., via Server code injection) allows an attacker to masquerade as Owner.

## 4. Post-Migration Verification

To verify Owner status is _not_ accidentally lost:

1.  Ensure `process.env.OWNER_ID` matches the Database ID of the business owner.
2.  Test `scripts/test_auth_phase1.js` (Manual Verification) which specifically tests the Env-based bypass.
