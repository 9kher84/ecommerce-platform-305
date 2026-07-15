# ADR-003: Why Identity Domain

**Decision:** Decouple `Account` (auth credentials) from `Business Identity` (Living Profiles for Buyers, Sellers, Organizations).

**Rationale:** Identity is an operational asset in a Commercial Intelligence Platform. Profiles must be built from actual transaction data (response times, delivery reliability) rather than self-reported attributes or simple ratings.