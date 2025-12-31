# B2B E-Commerce Platform - System Architecture & Operational Guide

## 1. System Overview
The B2B E-Commerce RFQ (Request for Quote) System is a specialized platform designed to facilitate high-volume, negotiated trade between business buyers and sellers. Unlike traditional e-commerce, it focuses on a "Request-Quote-Deal" workflow, efficiently handling complex negotiations, smart pricing, and bulk orders.

### Key Differentiators
*   **Speed & Real-time:** Built on Node.js/Express with Socket.IO for instant notifications and updates.
*   **Hybrid API:** Offers both a robust REST API for standard operations and a GraphQL API for flexible data fetching.
*   **Smart Pricing:** Automated pricing logic for sellers based on quantity and location matrices.
*   **Tiered Access:** Comprehensive subscription models (Free, Plan A, Plan B) for both buyers and sellers with granular permission control.

---

## 2. High-Level Architecture
The system follows a **Modular Monolith** architecture. While deployed as a single unit logic-wise, the codebase is strictly separated into distinct layers, allowing for future microservices extraction if needed.

### 2.1 Architectural Layers
1.  **Presentation Layer (API):**
    *   **REST Controllers:** Handle standard HTTP requests (`/api/*`).
    *   **GraphQL Resolvers:** Handle flexible data queries (`/graphql`).
    *   **Socket.IO:** Manages real-time event pushing.
2.  **Service Layer (Business Logic):**
    *   Contains the core business rules (e.g., `RequestService`, `QuoteService`).
    *   Framework-agnostic; does not depend on HTTP objects (req/res).
3.  **Data Access Layer (ORM):**
    *   Uses **Sequelize** with **PostgreSQL**.
    *   Models define schema, relationships, and validation hooks.
4.  **Infrastructure / Utility Layer:**
    *   **Redis:** For caching and rate limiting (with memory fallback).
    *   **Background Jobs:** (BullMQ integration planned/disabled).
    *   **Security:** JWT handling, hashing, and encryption.

---

## 3. Technology Stack

### Backend Core
*   **Runtime:** Node.js (v18+)
*   **Framework:** Express.js 4.x
*   **Internal Communication:** Event Emitter & Direct Service Calls

### Data Management
*   **Primary Database:** PostgreSQL 14+ (Relational data, Transactions)
*   **ORM:** Sequelize (Schema, Migration, Active Record Implementation)
*   **Caching/Store:** Redis (Session data, Rate limits, Cache lookups)
    *   *Resilience:* Includes automatic fallback to in-memory implementation if Redis fails.

### API & Communication
*   **REST API:** Standard CRUD operations.
*   **GraphQL:** Apollo Server (v4) for complex, nested data fetching.
*   **Real-time:** Socket.IO for notifications (Request updates, New Quotes).

### Security
*   **Authentication:** JWT (JSON Web Tokens) with Rotation (Access + Refresh Tokens).
*   **Access Control:** Role-Based (RBAC) & Subscription-Based permissions.
*   **Hardening:** `Helmet` (Headers), `hpp` (Param pollution), `xss` (Sanitization), `rate-limit-redis`.

---

## 4. Key Feature Implementation

### 4.1 Purchase Request Lifecycle
1.  **Draft:** Buyer creates request. Only verified validation occurs.
2.  **Published:** Buyer publishes request. `NotificationService` alerts relevant sellers.
3.  **Negotiating:** Sellers submit quotes. Buyer/Seller exchange counter-offers or clarifications.
4.  **Accepted:** Buyer accepts a quote. System creates a `Deal` record and generating invoice data.
5.  **Completed:** Delivery confirmed, transaction finalized. `AuditLog` records completion.

### 4.2 Smart Pricing Engine
*   Located in `SmartPricingService.js`.
*   Allows sellers (Plan B) to define pricing matrices based on:
    *   **Quantity Ranges:** (e.g., 100-500 units).
    *   **Location Targets:** (e.g., Riyadh, Jeddah).
*   **Execution:** When a request matches criteria, the system auto-generates a quote on behalf of the seller.

### 4.3 Fraud Detection & Security
*   **Self-Trading Prevention:** Compares Device Fingerprints and IP addresses of Buyer and Seller to prevent wash trading.
*   **Rate Limiting:** Multi-tiered limits (Global, Auth-specific, Payment-specific).
*   **Audit Logging:** Critical actions (Login, Payment, Deal Status) are recorded in immutable log tables.

---

## 5. Deployment & Scalability

### 5.1 Environment Configuration
Configuration is centralized in `config/index.js` and loaded via `.env`.
*   **Critical Vars:** `JWT_SECRET` (Must be strong/random), `DB_URL`, `REDIS_URL`.
*   **Modes:** `development`, `test`, `production` (toggles logging, strict cookies, stack traces).

### 5.2 Scaling Strategy
*   **Stateless Backend:** The API is stateless (JWT used for auth).
*   **Horizontal Scaling:** Can deploy multiple instances of the Node.js server behind a load balancer (Nginx/AWS ALB).
*   **Shared State:** Redis must be used for Rate Limiting and Socket.IO Pub/Sub in a multi-instance setup.

### 5.3 Database
*   **Performance:** Queries for browsing requests are optimized using raw SQL and Window Functions (`ROW_NUMBER`) to efficiently handle limits for "Free Tier" users without heavy ORM overhead.
*   **Migrations:** Managed via Sequelize CLI.

---

## 6. Security Specifications

### 6.1 Authentication Flow
1.  **Login:** User sends credentials. Server verifies bcrypt hash.
2.  **Issue:** Server issues **Access Token** (15m, HttpOnly Cookie) and **Refresh Token** (7d, DB Stored).
3.  **Use:** Frontend sends Cookie. `protect` middleware verifies signature.
4.  **Refresh:** On 401, frontend hits `/refresh`. Backend verifies DB token, checks revocation, rotates token family.

### 6.2 Data Protection
*   **Input Sanitization:** Custom middleware strips HTML/Script tags from JSON bodies.
*   **Payment Data:** PCI-DSS compliant design; no raw PANs stored. Only tokens/transaction references from gateways (Stripe/Mada).
*   **JTI Blacklist:** Mechanisms to immediately revoke specific JWTs before expiration.

---

## 7. Future Roadmap & Microservices
The codebase is structured to allow "peeling off" services:
*   **Notification Service:** Can be moved to a standalone node process handling only Socket.IO.
*   **Pricing Service:** The Smart Pricing logic can become a standalone function/worker.
*   **Job Queue:** Re-enabling BullMQ for email/reports on a separate worker node.

---

## 8. Technical Debt & Legacy Considerations
*   **Legacy Fields in PurchaseRequest:** The `PurchaseRequest` model contains several fields marked as "Old compatible fields" (e.g., `deliveryLocations` as JSON vs specific columns). These are maintained for backward compatibility but should be deprecated in future versions.
*   **Redis Dependency:** The system currently degrades gracefully (falling back to memory) if Redis is unavailable, but this limits horizontal scaling capabilities. Restoring full Redis reliability is a priority.
*   **File Storage:** Currently using local filesystem/buffer for uploads. Migration to object storage (AWS S3/MinIO) is required for stateless scaling.
