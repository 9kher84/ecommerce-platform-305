# 🦅 Phase 1: Buyer (Free) Identity & Spec

**Date:** 2025-12-16
**Status:** DRAFT
**Phase Target:** Buyer (Free) Only.

---

## 1. Identity Definition
The **Free Buyer** is the baseline user of the platform. They are procurement seekers who can post limited requests and accept deals but have zero visibility into market depth or advanced analytics.

*   **Role Key:** `buyer`
*   **Subscription Tier:** `free`
*   **Primary Goal:** Successfully post a request and accept a quote.

---

## 2. Capability Matrix (Strict)

### ✅ Allowed Actions (Capabilities)
These actions are fully permitted for the Free Buyer:

1.  **Request Management**:
    *   Create a "Draft" Request.
    *   Edit a "Draft" Request.
    *   **Publish Request**: Allowed **ONLY** if `Active Requests Count < 3` (Hard Limit).
    *   Cancel a Request.
2.  **Quote Interaction**:
    *   View Quote *Price* and *Terms* (Blind Mode).
    *   Accept a Quote (Transitions Request to `accepted`).
    *   Reject a Quote.
3.  **Account**:
    *   Update Profile (Name, Password).
    *   View My Requests List.

### 🚫 Forbidden Actions (Strict Exclusion)
These actions MUST fail at the API level and be hidden/disabled in the UI:

1.  **Actions**:
    *   **Edit Published Request**: STRICTLY FORBIDDEN. Must cancel and repost.
    *   **Reposting Expired**: FORBIDDEN if it violates the "Active Limit".
2.  **Visibility**:
    *   **Competitor Insight**: ZERO visibility into other buyers' requests or quotes.
    *   **Supplier Identity**: Hidden until "Acceptance" (Blind Auction).
3.  **Sovereign**:
    *   No Trace Access.
    *   No Override.

---

## 3. Buyer Dashboard v1 (Logical Wireframe)

The Dashboard must be simple, high-contrast, and focused on the "Active Limit".

### A. Layout Structure
*   **Sidebar**: Navigation (Requests, Profile, Settings) + **Limit Indicator**.
*   **Main Area**: Context-aware content (Empty State vs Active State).

### B. "Limit Indicator" Component (Critical)
Located prominently in the Sidebar or Top Bar:
*   **Visual**: A Progress Bar or Counter.
*   **Text**: "Active Requests: 1 / 3".
*   **State**:
    *   Green (0-1 requests).
    *   Yellow (2 requests).
    *   Red (3 requests - "LIMIT REACHED").
*   **Behavior**: If Red, the "New Request" button is DISABLED or triggers a Tooltip.

### C. Main Views

#### 1. "My Requests" (Home)
*   **Tabs**: Active, Drafts, History.
*   **Card Item**:
    *   Title, Status (Badge), Quote Count (Generic Number: "5 Quotes").
    *   **Action**: "View" (Primary), "Cancel" (Secondary).
    *   **Draft Item Action**: "Edit" (Allowed), "Publish".

#### 2. Request Details (Blind View)
*   **Header**: Request Status (e.g., "Awaiting Quotes").
*   **Quotes List**:
    *   List of cards showing ONLY: Price, Delivery Time, Warranty.
    *   **Supplier Name**: "Supplier #123" (Anonymized) or Hidden.
    *   **Actions**: "Accept", "Reject".

---

## 4. Limits + Rejection UX (Policy Engine)

The User Experience for hitting limits must be "Cold but Clear". No "Sovereign Trace" is revealed.

### Scenario A: Publish Limit Reached
*   **User Action**: User clicks "Publish" on a draft, but already has 3 active requests.
*   **Backend Response**: `403 Forbidden`.
*   **JSON Body**: `{ "error": "Plan Limit Reached", "code": "LIMIT_EXCEEDED_FREE" }`.
*   **Frontend UI**:
    *   **Toast/Alert**: "You have reached the limit of 3 active requests. Please cancel or complete an existing request to post a new one."
    *   **Color**: Red/Orange.
    *   **NO**: "Contact Admin to Override" (Doesn't exist).

### Scenario B: Editing Published Request
*   **User Action**: Tries to access `/edit/:id` for a `published` request.
*   **Frontend UI**: The "Edit" button is simply **MISSING** from the UI.
*   **Direct URL Access**: Redirects to Dashboard with "Action not permitted" toast.

---

## 5. Implementation Checklist (Phase 1)

1.  **Backend**:
    *   [ ] Verify `RequestService.publishRequest` enforces `count < 3` for `tier=free`.
    *   [ ] Ensure `RequestService.editRequest` throws if `status != draft` for `tier=free`.

2.  **Frontend**:
    *   [ ] Implement **Limit Indicator** in `BuyerDashboard`.
    *   [ ] Refactor `RequestCard` to hide "Edit" button if status is published.
    *   [ ] Refactor `RequestDetails` to ensure Supplier anonymity (if not already strictly enforced).
    *   [ ] Global Error Handler for `403 LIMIT_EXCEEDED` to show user-friendly message.

3.  **Testing**:
    *   [ ] Login as Free Buyer.
    *   [ ] Create 3 Requests -> Publish.
    *   [ ] Attempt 4th Request -> Verify UI Rejection.
    *   [ ] Attempt Edit on Published -> Verify Block.
