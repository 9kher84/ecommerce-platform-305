# Performance Baseline Report
**Date:** 2025-12-09  
**Version:** 1.0  
**Status:** ✅ FINAL BASELINE (Initial Findings)

---

## 1. Executive Summary

### Overview
This report establishes the initial performance baseline. Tests were conducted on a local development environment. **Crucially, the baseline tests revealed significant bottlenecks in the current configuration**, primarily due to aggressive rate limiting and missing database indexes.

### Key Findings (High Level)
- **System Health:** ⚠️ **Stressed** (High error rates during load)
- **Average Throughput:** ~1,591 req/sec (Health Endpoint)
- **Latency (p50):** 457 ms (Target: < 50ms) - **Significant Deviation**
- **Critical Bottlenecks:**
  1. **Rate Limiting:** ~95% of requests failed with 429/Timeouts during concurrency tests.
  2. **Database:** 8 Critical indexes missing.
  3. **Observability:** `pg_stat_statements` access restricted or extension missing.

---

## 2. Methodology & Test Environment

### Environment Verification
- **Hardware:** Intel i7-1355U (10 Cores), 16GB RAM
- **Software:** Node.js v20.19.5, PostgreSQL 14
- **Network:** Local loopback

### Test Scenarios
| Scenario | Endpoint | Priority | Target p95 | Achieved | Status |
|----------|----------|----------|------------|----------|--------|
| **Health Check** | `/api/health` | Critical | < 50ms | ~1184ms | ❌ F |

*Note: Other scenarios were impacted by the initial rate limit cascading failure.*

### Tools Used
- **Load Generation:** `autocannon` (100 connections, pipelining 10)
- **DB Analysis:** Custom Analysis Script (Sequelize-based)

---

## 3. detailed Results Analysis

### 3.1 Scenario A: Health Check
*Baseline essential for system uptime monitoring.*

| Metric | Measured Value | Target | Status |
|--------|----------------|--------|--------|
| **p50 Latency** | 457 ms | < 50ms | ❌ |
| **p95 Latency** | ~1184 ms | < 50ms | ❌ |
| **Throughput** | 1,591 req/sec | > 1k | ✅ |
| **Error Rate** | > 90% | < 0.1% | ❌ |

**Analysis:**
The high throughput combined with high error rate indicates the server is rejecting requests efficiently (Rate Limiter), but legitimate traffic (457ms) is extremely slow for a simple health check. This suggests the **Event Loop is blocked** or middleware overhead is excessive.

---

## 4. Database Performance Analysis

### Overview
Analysis identified structural deficiencies in the database schema optimization.

### Findings
- **Slow Query Access:** Failed (Permission/Configuration issue).
- **Index Suggestions:** **8 Critical Indexes Missing**.

### Critical Missing Indexes
The following indexes must be created immediately to support P2 load:

1.  **Users:** `role` (Role-based queries)
2.  **PurchaseRequests:** `userId`, `status` (User filtering)
3.  **PurchaseRequests:** `status`, `createdAt` (Stats & Filtering)
4.  **PurchaseRequests:** `categoryId` (Category filtering)
5.  **PriceQuotes:** `requestId` (Request-Quote join)
6.  **PriceQuotes:** `sellerId` (Seller dashboard)
7.  **AuditLogs:** `createdAt` (Cleanup jobs)
8.  **AuditLogs:** `userId` (Security tracking)

---

## 5. Critical Paths & Bottlenecks (Heat Map)

| Component | Latency Impact | Error Prob. | Optimization Priority |
|-----------|----------------|-------------|-----------------------|
| **Rate Limiter** | 🔴 Critical | High (429) | **P0** - Must Tune |
| **Database Schema**| 🔴 Critical | Medium | **P0** - Add Indexes |
| **Middleware** | 🟠 High | Low | **P1** - Profile CPU |
| **Observability** | 🟡 Medium | N/A | **P2** - Fix Permissions |

---

## 6. Recommendations Matrix

### Immediate Actions (Week 1 - P2.1)
1.  **Tune Rate Limit:** The current limit is too aggressive for load testing or high-traffic bursts. *Recommendation: Increase limit or implement "Test Mode" flag.*
2.  **Apply Indexes:** Execute the `CREATE INDEX` statements for the 8 missing patterns identified.
3.  **Fix DB Metrics:** Ensure the DB user has `pg_read_all_stats` or `pg_stat_statements` is correctly enabled for the connection user.

### Strategic Improvements (P2.2+)
1.  **Redis Caching:** Essential. The health check latency (457ms) implies DB hits or heavy computation that caching would eliminate.
2.  **Async Logging:** Ensure logging isn't blocking the main thread (Winston Transport optimization).

---

## 7. Conclusion

The initial baseline has served its purpose: **it exposed critical configuration flaws before we scaled.** While the performance grades are "F", they provide a clear, actionable roadmap. By fixing the Indexes and Rate Limiting, we expect to see p95 latency drop from >1s to <100ms in the next iteration.

**Next Milestone:** Apply indexes and re-run baseline.
