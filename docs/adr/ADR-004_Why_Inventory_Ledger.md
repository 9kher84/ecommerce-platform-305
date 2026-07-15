# ADR-004: Why Inventory Ledger

**Decision:** Inventory is managed via an Append-Only Ledger (`InventoryTransaction`) rather than direct state mutation.

**Rationale:** Provides perfect traceability (`balanceBefore`/`balanceAfter`), enables event-sourced projections (`SmartInventory`), and serves as a reliable truth source for the Commercial Records Domain and AI models.