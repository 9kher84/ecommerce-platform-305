# 5. Security Threat Model (STRIDE) - Sovereign Scope

_Extracted from full Security Audit._

## 1. Spoofing Identity (Owner)

- **Risk**: Critical. Capturing the Owner session allows total overrides.
- **Mitigation**: Owner Isolation. Owner Session is strictly cookie-based `httpOnly`. Frontend holds no logic.
- **Status**: Certified (Chaos Test A).

## 2. Tampering (Audit Logs)

- **Risk**: Critical. Altering history to hide overrides.
- **Mitigation**: Application-Layer Immutability. No Write-Routes. Server-Side HMAC Signing.
- **Status**: Certified (Chaos Test B).

## 3. Repudiation

- **Risk**: High. "I didn't authorize that override."
- **Mitigation**: Every override mandates a `Reason` string (min 15 chars) and logs `ActorID`, `IP`, and `TraceSnapshot`.
- **Status**: Implemented.

## 4. Elevation of Privilege

- **Risk**: High. Standard admin guessing Owner API.
- **Mitigation**: `OwnerRoute` acts as a facade; Backend `ownerMiddleware` rejects non-owner sessions regardless of frontend state.
- **Status**: Implemented.
