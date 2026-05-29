# 📖 Sovereign Platform: Operational User Guides

## Phase 3: RFQ & Decision Flow

This document provides step-by-step instructions for Buyers and Sellers to use the newly implemented Request for Quotation (RFQ) and Decision Board systems.

---

### 1. 🛒 Buyer Guide: How to Publish an RFQ

**Objective:** Create a request to receive competitive offers from qualified sellers.

1.  **Log In:** Sign in as a `Buyer`.
2.  **Navigate:** Go to the **"Create Request"** page from your dashboard.
3.  **Fill Mandatory Fields:**
    - **Title:** e.g., "100 Tons of Cement".
    - **Category:** Select the appropriate sector (e.g., Building Materials).
    - **Quantity & Unit:** Define your needs.
    - **Description:** Clear technical specs.
    - **Urgency:** Set the priority.
4.  **Publish:** Click **"Publish RFQ"**.
5.  **Status:** Your request is now `rfq_published` and visible to all verified sellers in that sector.

---

### 2. 🏪 Seller Guide: How to Submit a Quote

**Objective:** Provide a competitive offer to a buyer's request.

1.  **Log In:** Sign in as a `Seller`.
2.  **Browse Marketplace:** Go to **"New RFQs"** or browse the marketplace for your sector.
3.  **Select Request:** Find a request (e.g., "100 Tons of Cement") and click **"Submit Quote"**.
4.  **Simple Quote Form:** Fill the 4 essential fields:
    - **Amount:** Your total price.
    - **Delivery Time:** When can you deliver?
    - **Warranty:** (If applicable).
    - **Notes:** Technical details or unique selling points.
5.  **Send:** Click **"Send Offer"**.
6.  **Status:** Your quote is now `pending` and visible to the buyer on their Decision Board.

---

### 3. ⚖️ Buyer Guide: How to Make a Decision

**Objective:** Compare offers and select the best one.

1.  **Log In:** Sign in as the `Buyer`.
2.  **Go to Dashboard:** Click on **"My Requests"**.
3.  **Decision Board:** Find your RFQ and click the **"Decision Board"** button.
4.  **Compare:** Review all seller offers in the comparison table.
5.  **Action:**
    - **Accept:** If the offer is perfect. This automatically starts a **Deal** and reveals contacts.
    - **Reject:** If the offer doesn't meet requirements.
    - **Backup:** Save as a secondary option.
6.  **Completion:** Upon acceptance, you will be redirected to the **Invoice Page** containing the seller's contact numbers and official details.

---

### ⚙️ Infrastructure & Compliance (Admin Only)

- **Database:** Ensure `.env` contains the correct `DB_PASSWORD`.
- **Secrets:** Managed via Vault (Simulated in Dev).
- **PII:** Contact details are revealed ONLY after a quote is moved to `accepted`.

---

**Sovereign Architecture Protocol v3.0**
_(c) 2026 Project SOVEREIGN_
