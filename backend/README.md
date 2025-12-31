# 🦅 Sovereign E-Commerce Platform - Handover Protocol

**System Status:** 🟢 PRODUCTION READY  
**Version:** 2.0 (Sovereign Edition)  
**Docs Ref:** SSC/DOCS-2026

---

## 🚀 Quick Start (Production in 5 Minutes)

### Prerequisites
- Node.js v18+
- PostgreSQL
- Redis
- Vault (Optional for Dev, Required for Prod)

### 1. Installation
```bash
git clone <repo_url>
cd backend
npm install
```

### 2. Configuration & Secrets
The system uses **HashiCorp Vault** in production. For development, create `.env` (NOT tracked in git):
```ini
PORT=5000
NODE_ENV=development
DATABASE_URL=postgres://user:pass@localhost:5432/ecommerce
REDIS_URL=redis://localhost:6379
JWT_SECRET=sovereign_secret_key_change_me
OWNER_ID=uuid-of-owner
```

### 3. Launch
```bash
# Run Database Migrations
npm run db:migrate

# Start Server
npm start
```
*Server will be live at `http://localhost:5000`*

---

## 🛡️ Operational Directives

### A. Monitoring & Observability
- **Health Check:** `GET /api/health` 
    - Checks: DB, Redis, Memory, Disk. 
    - SLA: Response < 200ms.
- **Logs:** Located in `backend/logs/`.
    - `error.log`: Critical failures.
    - `combined.log`: All traffic.
- **Alerts:** System auto-alerts if **500 Error Rate > 1%** (simulated in logs).

### B. Backup & Recovery (DR)
- **Daily Script:** `npm run backup` (Executes `scripts/sovereign_backup.js`)
- **Action:** Dumps DB + Vault, Encrypts with AES-256, saves to `backups/`.
- **RTO (Recovery Time):** ~15 Minutes (Restore DB Dump + Reboot).

### C. Security Gates
- **Audit:** `npm run security-gate` runs before every commit.
- **Firewall:** Helmet, CORS, Rate Limiting (Redis-backed) are active by default.

---

## 📚 API Reference
Full Swagger Documentation available at:
👉 **`http://localhost:5000/api-docs`**

**Critical Endpoints:**
1. **Auth:** `POST /api/auth/login`
2. **Requests:** `POST /api/requests` (Buyer)
3. **Quotes:** `POST /api/quotes` (Seller)
4. **Admin:** `GET /api/admin/users`

---
*Signed, Sovereign Engineering Team*
