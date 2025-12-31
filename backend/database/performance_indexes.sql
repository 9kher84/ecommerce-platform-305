-- Performance Remediation Indexes (P2.1)
-- Date: 2025-12-09
-- Objective: Optimize critical query paths identified during Baseline Analysis

-- 1. Users Table
-- Reason: Frequent lookups by role for admin dashboards and filtering.
CREATE INDEX IF NOT EXISTS idx_users_role ON "Users" ("role");

-- 2. PurchaseRequests Table
-- Reason: Critical filtering by user and status (Buyer Dashboard).
CREATE INDEX IF NOT EXISTS idx_purchaserequests_userid_status ON "PurchaseRequests" ("userId", "status");

-- Reason: Admin/Seller feeds filtering by status and sorting by date.
CREATE INDEX IF NOT EXISTS idx_purchaserequests_status_createdat ON "PurchaseRequests" ("status", "createdAt");

-- Reason: Filtering requests by category.
CREATE INDEX IF NOT EXISTS idx_purchaserequests_categoryid ON "PurchaseRequests" ("categoryId");

-- 3. PriceQuotes Table
-- Reason: Joining quotes to requests (View Request Details).
CREATE INDEX IF NOT EXISTS idx_pricequotes_requestid ON "PriceQuotes" ("purchaseRequestId");

-- Reason: Seller Dashboard - viewing their own quotes.
CREATE INDEX IF NOT EXISTS idx_pricequotes_sellerid ON "PriceQuotes" ("sellerId");

-- 4. AuditLogs Table
-- Reason: Cleanup jobs (retention policy) and strict ordering.
CREATE INDEX IF NOT EXISTS idx_auditlogs_createdat ON "audit_logs" ("createdAt");

-- Reason: Security tracking per user.
CREATE INDEX IF NOT EXISTS idx_auditlogs_userid ON "audit_logs" ("userId");
