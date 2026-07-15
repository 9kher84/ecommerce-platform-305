# ADR-005: Why Multi-Agent

**Decision:** Design the system to support multiple AI Agents (Sales, Procurement, Warehouse) per Organization governed by `Organization Policies`.

**Rationale:** A single monolithic agent cannot handle the specialized complexity of different business departments. Multi-Agent design allows specialized AI consumers to listen to the EventBus and act autonomously within their defined policy bounds.