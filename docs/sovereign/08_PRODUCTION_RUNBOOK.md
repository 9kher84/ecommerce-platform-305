# 8. Sovereign Production Runbook
**Status**: DRAFT | **Classification**: INTERNAL ONLY

## 1. Emergency Kill Switch
If the Owner Panel is compromised or under legal hold:
1.  Access Server Environment Variables.
2.  Set `OWNER_PANEL_ENABLED=false`.
3.  Restart Service (or wait for dynamic reload if supported).
4.  **Effect**: All `/api/owner` endpoints immediately return `503 Service Unavailable`.

## 2. Rotating Sovereign Secrets
If `JWT_SECRET` or `SIGNATURE_KEY` is leaked:
1.  **Generate New Keys**: Use high-entropy random generation (e.g., `openssl rand -hex 64`).
2.  **Update Env**: Update `JWT_SECRET` and `SIGNATURE_KEY` in production environment.
3.  **Deploy**: Rolling restart.
4.  **Impact**: All existing Owner Sessions are invalidated. All export verifications prior to rotation require the *Old Key* for verification (archive old keys securely!).

## 3. Incident Response: Corrupt Audit Log
If an Integrity Check fails (Hash Mismatch):
1.  **Isolate**: Trigger Kill Switch immediately.
2.  **Snapshot**: Take a full DB dump.
3.  **Forensics**: Compare the `integrity.hash` in the JSON with a re-calculated hash of the `trace` object.
4.  **Root Cause**: If mismatch entails data modification, assume DB breach.

## 4. Legal Hold Procedure
If a court order requires "Freezing" the system state:
1.  **Export All Audits**: Run `scripts/internal/export_all_audits.js` (to be implemented).
2.  **Disable Overrides**: Set `OWNER_PANEL_ENABLED=false` (Read-only is not enough if the court demands NO changes).
3.  **Chain of Custody**: Hash the Export and timestamp it on a separate WORM (Write-Once-Read-Many) storage.
