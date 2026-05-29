# Phase 2 Rollback Plan: Authorization Migration

## 🛑 Critical Warning

**Do not execute any manual rollback queries without verifying backups first.**
This document outlines the procedure to revert changes made during **Phase 2 (Role & Context Migration)**.

---

## 1. Trigger Conditions

Initiate rollback immediately if any of the following occur:

1.  **Migration Script Failure**: `scripts/migrate_roles.js` crashes midway.
2.  **Verification Failure**: Post-migration verification script fails (> 0 errors).
3.  **Application Critical Failure**: Users cannot login or receive "Forbidden" errors immediately after migration.
4.  **Integrity Violation**: UserRoles count significantly differs from expected (Refer to Dry Run Report).

## 2. Backup Strategy

Before execution, a snapshot MUST be taken.

- **Command**: `pg_dump -U postgres -d ecommerce_db > migration_backup_{DATE}.sql`
- **Location**: Secure S3 bucket / Encrypted local storage.

## 3. Rollback Procedures

### Scenario A: Partial Migration (Script crashed midway)

If the script fails, the database might be in a mixed state (some users have entries in `UserRoles`, others don't).

**Steps:**

1.  **Stop Traffic**: Enable maintenance mode or stop backend service.
2.  **Truncate Junction Table**:
    Since `UserRoles` is a new table and only populated by this migration, it is safe to truncate it to reset the state.
    ```sql
    TRUNCATE TABLE "UserRoles" RESTART IDENTITY CASCADE;
    ```
3.  **Verify Clean Slate**: Ensure `UserRoles` count is 0.
4.  **Restart/Retry**: Fix the script bug and retry, or abort.

### Scenario B: Data Corruption (Wrong mapping applied)

If migration completed but users have wrong roles.

**Steps:**

1.  **Stop Traffic**.
2.  **Truncate Junction Table**:
    ```sql
    TRUNCATE TABLE "UserRoles" RESTART IDENTITY CASCADE;
    ```
3.  **Restore Trust**: Manually verify `scripts/migrate_roles.js` mapping logic.
4.  **Re-run Migration**.

### Scenario C: Total Catastrophe (DB Unstable)

If tables are dropped or data is lost irreversibly.

**Steps:**

1.  **Stop Traffic**.
2.  **Drop Database**:
    ```sql
    DROP DATABASE ecommerce_db;
    CREATE DATABASE ecommerce_db;
    ```
3.  **Restore from Backup**:
    ```bash
    psql -U postgres -d ecommerce_db < migration_backup_{DATE}.sql
    ```
4.  **Verify Integrity**: Run `scripts/verify_auth_schema.js`.

## 4. Post-Rollback Verification

After rolling back (Scenario A/B):

1.  Run `scripts/migrate_roles_dry_run.js` to ensure the source data (ENUMs) is still intact and readable.
2.  Login as a standard user to verify the application falls back to Legacy logic (if dual-mode is supported) OR stays in maintenance until fixed.

## 5. Decision Log

- **Who authorizes Rollback?**: System Owner / Lead Developer.
- **Communication**: Notify all stakeholders immediately upon decision.
