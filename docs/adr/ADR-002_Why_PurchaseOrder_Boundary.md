# ADR-002: Why PurchaseOrder Boundary

**Decision:** The boundary between Procurement (Epic 4) and Fulfillment (Epic 5) is strictly at the Purchase Order.

**Rationale:** Once a PO is accepted, the upstream documents (RFQ, Quotation, Award) are immutable and irrelevant to fulfillment operations. Fulfillment only cares about the PO and its items, preventing tight coupling between negotiation and logistics.