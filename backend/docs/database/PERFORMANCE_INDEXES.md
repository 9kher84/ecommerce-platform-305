# Performance Remediation Indexes
**Date:** 2025-12-09
**Status:** ✅ Applied

---

## 🎯 Objective
During P2.1, we identified critical missing indexes that would cause full table scans under load. This document tracks the indexes applied to remediate this.

## 📊 Applied Indexes

### 1. Users Table
| Index Name | Columns | Impact |
|------------|---------|--------|
| `idx_users_role` | `role` | Optimizes admin dashboards filtering users by role. |

### 2. PurchaseRequests Table
| Index Name | Columns | Impact |
|------------|---------|--------|
| `idx_purchaserequests_userid_status` | `userId`, `status` | **Critical:** Used in Buyer Dashboard to verify request ownership. |
| `idx_purchaserequests_status_createdat` | `status`, `createdAt` | Used in sorting and filtering public request feeds. |
| `idx_purchaserequests_categoryid` | `categoryId` | Optimizes category-based browsing. |

### 3. PriceQuotes Table
| Index Name | Columns | Impact |
|------------|---------|--------|
| `idx_pricequotes_requestid` | `purchaseRequestId` | **Critical:** Speeds up JOINs when fetching request details with quotes. |
| `idx_pricequotes_sellerid` | `sellerId` | Optimizes Seller Dashboard quote management. |

### 4. AuditLogs Table
| Index Name | Columns | Impact |
|------------|---------|--------|
| `idx_auditlogs_createdat` | `createdAt` | Vital for data retention cleanup jobs (avoids full scan on huge table). |
| `idx_auditlogs_userid` | `userId` | Investigating security incidents per user. |

---

## 📈 Expected ROI
- **Query Latency:** Expected 70-90% reduction for filtered queries.
- **CPU Usage:** Reduced sorting/scanning overhead.
- **Scalability:** Enables handling 100k+ records efficiently.

## 🔄 Reversibility
To rollback:
```sql
DROP INDEX idx_users_role;
DROP INDEX idx_purchaserequests_userid_status;
DROP INDEX idx_purchaserequests_status_createdat;
DROP INDEX idx_purchaserequests_categoryid;
DROP INDEX idx_pricequotes_requestid;
DROP INDEX idx_pricequotes_sellerid;
DROP INDEX idx_auditlogs_createdat;
DROP INDEX idx_auditlogs_userid;
```
