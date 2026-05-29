# P2.1: Production-Like Performance Testing Plan

## Phase Objectives

1.  **Realistic Environment:** Conduct tests in an environment that closely mimics production to get actionable data.
2.  **Real-World Metrics:** Measure performance without the noise of development tools (mocks, watchers).
3.  **Optimization Targets:** Identify actual code bottlenecks once environment bottlenecks are removed.

## Technical Requirements

- **Redis:** Local Redis instance or Docker container (Must replace Mock Redis).
- **Database:** PostgreSQL with tuned connection pool (Max connections >= Test concurrency).
- **Runtime:** Node.js running directly (no `nodemon`), `NODE_ENV=production` (or `perf`).
- **Logging:** Reduced to Error-only or Warn-only to minimize I/O overhead.

## Success Criteria (KPIs)

| Endpoint               | Metric             | Target                          |
| :--------------------- | :----------------- | :------------------------------ |
| `/api/health/advanced` | **p95 Latency**    | **< 500ms** (at 100 concurrent) |
| All Endpoints          | **Error Rate**     | **< 1%**                        |
| System                 | **Memory Usage**   | Stable under 30-min soak test   |
| System                 | **Event Loop Lag** | < 100ms                         |

## Execution Steps

1.  **Setup Redis:** Install/Run Redis locally.
2.  **Config Update:** Update `.env` to point to real Redis and enable production mode.
3.  **Pool Tuning:** Update `sequelize_setup.js` to allow configurable pool sizes via ENV.
4.  **Run Test:** Execute `baselineTest.js` (with p95 fix) against the improved setup.
