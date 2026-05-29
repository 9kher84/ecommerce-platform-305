# B2B Market Hub

> Internal B2B procurement coordination platform.

## 📦 Overview

This is the main backend for our B2B platform. It handles the orchestration between buyers and sellers, focusing on RFQs, quotes, deals, and invoicing.

## 🚀 Tech Stack

- **Runtime**: Node.js (v20+)
- **Database**: PostgreSQL (v16+)
- **ORM**: Sequelize
- **Queue**: BullMQ with Redis
- **Frontend**: React (located in /frontend)

## 🛠️ Local Development

### Backend

```bash
cd backend
cp .env.example .env
# Set your DB and Redis credentials
npm install
npx sequelize-cli db:migrate
npm run dev
```

### Frontend

```bash
cd frontend
npm install
npm start
```

## 🤝 Deployment

- Backend runs on port 5000.
- Ensure `NODE_ENV=production`.
- Redis is required for BullMQ.
- Run `npm run build` for frontend.

## 🧩 API Endpoints (Major ones)

- `POST /api/requests` - Create RFQ
- `POST /api/requests/:id/quotes` - Submit a quote
- `GET /api/dashboard/buyer/invoices` - Get buyer invoices

## 🐞 Known Issues

- ~~The invoice number sequence sometimes skips numbers in high concurrency.~~ (Fixed in v2.1, but needs monitoring.)
- The search query in `requestService.js` may be slow on large datasets.

## 📜 License

Internal use only. All rights reserved.
