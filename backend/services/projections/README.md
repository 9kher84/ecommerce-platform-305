# Projections Directory

This directory is reserved for services that consume `OperationalEvent`s to project read models (e.g. Dashboards).
By adopting this pattern (CQRS / Event Sourcing), the command side (operational services) is decoupled from the query side.

## Planned Projections (Blocker #23)
- `DashboardConsumer.js`: Will listen to fulfillment and SLA events to build highly-optimized tables or materialized views for Admin and User Dashboards.
