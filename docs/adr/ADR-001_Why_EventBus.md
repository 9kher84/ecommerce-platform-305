# ADR-001: Why EventBus

**Decision:** Use a decoupled EventBus for all operational state changes instead of direct service-to-service calls.

**Rationale:** Enables true Multi-Domain integration, allows AI Agents to act as consumers, and prepares the platform for Kafka/RabbitMQ migration without breaking core logic.