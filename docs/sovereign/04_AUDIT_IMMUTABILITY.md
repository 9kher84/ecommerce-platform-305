# 4. Audit Immutability & Integrity

## The "Write-Once" Guarantee
Legal defensibility requires that the history of an override cannot be altered by the overrider.

### Application Layer Enforcement
*   **No DELETE Routes**: `auditLog` endpoints are `GET` only.
*   **No UPDATE Routes**: `auditLog` endpoints are `GET` only.
*   **Hardened Controller**: `ownerController.js` creates logs using `AuditLog.create()` but exposes no method to access `.destroy()` or `.update()`.

### Export Integrity
*   Files exported via `/api/owner/audit-logs/:id/export` are **Server-Signed**.
*   **Algorithm**: HMAC-SHA256 using the server's `JWT_SECRET` (or dedicated `SIGNATURE_KEY`).
*   **Verification**: Can be re-verified by the server at any time to prove the JSON content has not been tampered with since export.

### Future Work (Phase 5+)
*   **Database Constraints**: Add `TRIGGER BEFORE UPDATE RAISE EXCEPTION` on the `audit_logs` table for defense-in-depth.
