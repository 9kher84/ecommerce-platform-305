# 🔒 User & Roles Capability Review (Non-Sovereign Scope)

**Date:** 2025-12-16
**Status:** VALIDATED
**Scope:** Web Platform (Buyers, Sellers, Admins)

## 1. Role Inventory

The system currently acknowledges the following **Non-Sovereign Roles**:

1.  **Buyer** (`role: buyer`)
2.  **Seller** (`role: seller`)
3.  **Admin** (`role: admin`)
4.  **Super Admin** (`role: super_admin`)
5.  **Marketer** (`role: marketer`)

_Note: The "Owner" is a distinct Identity defined by `OWNER_ID` environment variable, not just a role string._

---

## 2. Detailed Capability Matrix

### 👤 1. Buyer

- **Primary Function**: Request Procurement.
- **🔹 Data Actions (Allowed)**:
  - Create Purchase Request (Draft).
  - Edit Request (Only in `draft` state).
  - _Premium Exception_: Plan A/B Buyers can edit `published` requests.
  - Update Profile / Settings.
- **🔸 State Transitions (Allowed)**:
  - `draft` → `published` (Subject to Subscription Quota).
  - `awaiting_decision` → `accepted` (Creates Deal).
  - `any` → `cancelled`.
- **❌ Explicitly Forbidden**:
  - Viewing Competitor Quotes (Blind Auction).
  - Switching Status to `completed` manually.
  - **Any Sovereign Action (Override/Trace).**

### 🏪 2. Seller

- **Primary Function**: Supply & Quoting.
- **🔹 Data Actions (Allowed)**:
  - Submit Price Quote.
  - Edit Quote (Before acceptance).
  - Manage Inventory (Products).
- **🔸 State Transitions (Allowed)**:
  - `submitted` → `withdrawn` (Quote status).
- **❌ Explicitly Forbidden**:
  - Viewing Competitor Identity (in Public/Secret Auctions).
  - Modifying Request Terms.

### 🛡️ 3. Admin / Super Admin

- **Primary Function**: Operational Support & Moderation.
- **🔹 Data Actions (Allowed)**:
  - View All Users (Read-Only).
  - View All Requests (Read-Only).
  - Manage Categories / Settings.
- **🔸 State Transitions (Allowed)**:
  - User Status: `active` ↔ `suspended` (Requires specific permission `manage_users`).
  - Request Status: `published` → `suspended` (Moderation).
- **❌ Explicitly Forbidden (Sovereign Exclusions)**:
  - **State Forcing**: Cannot force a request from `draft` to `published` ignoring validation.
  - **Trace Access**: Cannot view the "Why" behind a Policy Rejection.
  - **Audit Deletion**: Cannot delete or modify `AuditLogs`.
  - **Impersonation**: Cannot impersonate `Owner`.

---

## 3. Transition Logic & Policy Enforcement

All State Transitions passed through the `RequestService` strict State Machine.

- **Policy Engine**: The logic is **Hardcoded** in `RequestService.js` (e.g., Validating Quote Count before `awaiting_decision`).
- **Rejection Experience**:
  - If an action violates policy (e.g., Free user trying to post > 3 times):
  - **User Sees**: Standard HTTP 403 Error Message (e.g., "Subscription Limit Reached").
  - **No Trace**: The system does **NOT** generate or show a Sovereign Trace ID to non-owners.

---

## 4. Sovereign Affirmation

I certify, based on code analysis of `requestService.js`, `authMiddleware.js`, and `adminRoutes.js`, that:

1.  **NO OVERRIDE**: No `Override` function exists accessible to `admin`, `buyer`, or `seller`.
2.  **NO FORCE**: No "Force Transition" parameter accepts input from these roles.
3.  **NO TRACE**: The `TraceViewer` and `TraceEngine` are physically absent from the non-owner controllers.
4.  **NO AUDIT ACCESS**: The `AuditLog` table is strictly Read-Only for the Owner via `/api/owner`.

**The Separation of Concerns is Validated.**
