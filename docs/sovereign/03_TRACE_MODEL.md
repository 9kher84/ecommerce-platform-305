# 3. Trace Model & Inspection

## The "Why" Engine
The system does not just return `true/false`. It returns a **Trace Object**.

### Schema (v1.0)
```json
{
  "traceId": "uuid",
  "decision": "ALLOW | DENY",
  "context": { "actor": "...", "resource": "..." },
  "timeline": [
    { "step": "Basic Role Check", "status": "PASS" },
    { "step": "Attribute Check", "status": "FAIL", "reason": "Data Ownership Mismatch" }
  ],
  "integrity": { "hash": "sha256...", "signed": true }
}
```

## Simulation vs. Reality
*   **Simulation**: `tracePolicy()` endpoint runs the engine "as if" the Actor were performing the action.
*   **Reality**: `override*()` endpoint commits the action despite the simulation returning `DENY`.

## Context Poisoning
The Engine detects if the Context Object passed to it attempts to inject circular references or prototype pollution.
