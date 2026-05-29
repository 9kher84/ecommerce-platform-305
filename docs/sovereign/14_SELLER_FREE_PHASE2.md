# 🦅 Phase 2: Seller (Free) Architecture

**Date:** 2025-12-16
**Status:** DRAFT (Phase 2 Spec)
**Role:** Seller (Free)
**Scope:** Strict Lifecycle, Policy Lab Control, and Data Isolation.

---

## 1. Identity & Core Function

The **Free Seller** is a supplier with limited capacity, intended for small businesses or trial users. Their primary function is to browse public requests and submit fixed-price quotes.

- **Role Key:** `seller`
- **Subscription Tier:** `free`
- **Core Restriction:** CANNOT initiate contact. MUST wait for Buyers to post Public Requests.
- **Inventory Limit:** 20 Products Total.

---

## 2. Capability Matrix (Strict)

### ✅ Allowed Actions (Capabilities)

1.  **Inventory**:
    - Add Product (Text + Info Only, limited images).
    - Max 20 Active Products.
2.  **Quoting**:
    - View **Public** Requests (Blind Mode - No Competitors).
    - Submit **Fixed Price** Quote (No ranges, no smart pricing).
    - Withdraw Quote (Penalty applies).
    - **Blind Auction**: Can see "Rank" (e.g., "You are the lowest price") but NOT specific competitor prices.
3.  **Deal Execution**:
    - Receive "Acceptance" Notification.
    - View Buyer Contact Info (After Acceptance).
    - Mark "Shipped" / "Delivered".

### 🚫 Forbidden Actions (Strict Exclusion)

1.  **Sovereign**:
    - **Trace Access**: ZERO visibility into rejection reasons (Policy Lab Hidden).
    - **Override**: Cannot force any state change.
    - **Audit**: Cannot view Audit Logs.
2.  **Marketplace**:
    - **Smart Pricing**: Cannot use auto-calculated pricing (Plan B only).
    - **Flexible Pricing**: Cannot submit "Range" or "Estimate" (Plan A+).
    - **Secret Auctions**: Cannot participate in Invited/Secret auctions (unless explicitly invited by Buyer).
    - **Buyer Direct Contact**: Cannot see Buyer Email/Phone BEFORE Acceptance.

---

## 3. The Seller Lifecycle (State Machine)

### Stage 1: Registration (Policy Gate)

1.  **User Action**: Sign up as Seller.
2.  **Policy Lab**: Checks email domain, IP reputation.
3.  **Result**: Account Created (Status: `active` or `pending_verification`).
    - _Free Seller is immediately Active but limited._

### Stage 2: Inventory (Data Isolation)

1.  **User Action**: Adds "Product X".
2.  **Isolation**: Product is stored with `sellerId`. NO other seller can see this inventory. It is purely for the Seller's internal management and for the "System" to recommend them to Buyers later (AI Matching Phase).
3.  **Limit**: Hard System Check `count < 20`.

### Stage 3: Discovery & Quoting (Blind)

1.  **View**: Seller sees "Public Request #99 - 50x Laptops".
2.  **Isolation**: Seller sees NO other quotes.
3.  **Action**: Submit Quote (Price: 5000 SAR).
4.  **Policy Check**:
    - Is Request Active? Yes.
    - Is Seller Active? Yes.
    - Is Price Fixed? Yes (Free tier requirement).
5.  **Result**: Quote Created (`status: pending`).

### Stage 4: Deal & Delivery (Sovereign Contract)

1.  **Transition**: Buyer Accepts Quote.
2.  **Event**: `Request(accepted)` -> `Deal(created)`.
3.  **Visibility Unlock**: Seller NOW sees Buyer Phone/Email.
4.  **Action**: Seller arranges delivery.
5.  **Completion**: Seller clicks "Mark Delivered" -> Buyer Confirms -> Status `completed`.

---

## 4. Policy Lab & Sovereign Oversight

### A. The "Wall of Silence"

When a Seller violates a policy (e.g., trying to submit a Flexible Price):

- **User Experience**: Generic 403 Message ("Feature not available in Free Plan").
- **Sovereign Level**: The `TraceEngine` records the attempt (visible ONLY to Owner).
- **No Feedback**: The Seller is NOT told "Upgrade to Plan A to fix this". They are simply told "Forbidden".

### B. Owner Override (The Exception)

The Owner's "Override" button appears **ONLY** in the Admin Dashboard, and **ONLY** in rigorous states:

1.  **Stuck State**: If a Deal is `processing` for > 15 days without delivery.
2.  **Dispute**: If Buyer and Seller report conflicting status (e.g., Buyer says "Not Received", Seller says "Delivered").

- **Mechanism**: Owner can force transition `Deal --> cancelled` or `Deal --> completed`.
- **Seller View**: They see the status change, attributed to "System Administrator" (No Sovereign Trace revealed).

---

## 5. Security & Isolation

1.  **Row-Level Security (RLS) Logic**:
    - `Quotes`: `where sellerId = current_user.id`.
    - `Products`: `where sellerId = current_user.id`.
    - `Deals`: `where sellerId = current_user.id`.
2.  **SSRF Protection**: Image uploads for Products MUST go through the `FetchProtected` proxy to prevent internal network scanning.
3.  **Input Sanitation**: Strict validation on Product Descriptions to prevent XSS/Injection.

---

## 6. Implementation Checklist (Phase 2)

1.  **Backend**:
    - [ ] Verify `QuoteService.submitQuote` enforces `Fixed Price` for Free Tier.
    - [ ] Confirm `ProductController` enforces 20 Product Limit.
    - [ ] Ensure `DealService` allows Seller to "Mark Delivered".

2.  **Frontend (Seller Dashboard)**:
    - [ ] Build "My Inventory" Tab (CRUD with Limit Indicator).
    - [ ] Build "Marketplace" Tab (Public Requests Feed).
    - [ ] Build "My Quotes" Tab (Status tracking).
    - [ ] Implement "Upgrade Blocker" for Plan-A features (Greyed out inputs with Tooltip).

3.  **Owner Verification**:
    - [ ] Test Override on a "Stuck Deal".
