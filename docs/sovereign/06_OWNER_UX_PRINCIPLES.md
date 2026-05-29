# 6. Sovereign UX Principles

## Philosophy: "User as Judge, not Admin"

1.  **Decision Framing**:
    - Never present a "Button" without the "Context".
    - **Rule**: `Preview Impact` must load _before_ `Confirm Override` is enabled.

2.  **Cognitive Closure**:
    - Action completion is not just a toast notification. It is a **State of Record**.
    - **Pattern**: Form -> Processing -> Sealed Record View (Modal).

3.  **Anti-Patterns (Prohibited)**:
    - ❌ **One-Click Overrides**: Reckless.
    - ❌ **Bulk Actions**: Dangerous. Every sovereign decision is unique.
    - ❌ **Gamification**: Inappropriate.
    - ❌ **Hiding Consequences**: Unethical.

4.  **Metric Thresholds**:
    - **Reckless**: Decision < 5s.
    - **Deliberate**: Decision 15s - 60s.
    - **Confused**: Abort Rate > 40%.
