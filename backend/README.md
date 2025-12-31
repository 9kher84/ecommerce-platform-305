# E-Commerce Platform Backend

A comprehensive B2B e-commerce platform connecting buyers and sellers with advanced features including fraud detection, payment integration, and real-time notifications.

## 🚀 Features

### Core Functionality
- **User Management**: Registration, authentication, role-based access control
- **Purchase Requests**: Buyers create detailed purchase requests
- **Price Quotes**: Sellers submit competitive quotes
- **Deal Management**: Complete deal lifecycle from negotiation to completion
- **Real-time Notifications**: Socket.IO powered instant updates
- **Payment Integration**: Ready for activation (pending official permits)

### Security Features
- ✅ JWT Authentication with HttpOnly cookies
- ✅ Refresh token rotation
- ✅ Device fingerprinting for fraud detection
- ✅ SSRF protection
- ✅ Rate limiting
- ✅ Input sanitization
- ✅ GraphQL query depth limiting
- ✅ Audit logging

### Subscription Tiers
- **Free**: Basic features with limitations
- **Plan A**: Advanced features for serious buyers/sellers
- **Plan B**: Premium features with multiple delivery locations

## 📋 Prerequisites

- **Node.js**: >= 16.0.0
- **PostgreSQL**: >= 12.0
- **Redis**: >= 6.0 (optional, graceful fallback to memory store)
- **npm**: >= 7.0.0

## 🛠️ Installation

### 1. Clone the Repository
```bash
git clone <repository-url>
cd ecommerce-platform/backend
```

### 2. Install Dependencies
```bash
# Use npm ci for production-like installs
npm ci

# Or for development
npm install
```

### 3. Environment Configuration
Create a `.env` file in the backend directory:

```env
# Server Configuration
PORT=5000
NODE_ENV=development
CLIENT_URL=http://localhost:3000

# Database Configuration
DB_HOST=localhost
DB_PORT=5432
DB_DATABASE=ecommerce_db
DB_USER=postgres
DB_PASSWORD=your_password

# JWT Configuration
JWT_SECRET=your_super_secret_jwt_key_change_in_production
JWT_EXPIRE=15m
JWT_COOKIE_EXPIRE=15

# Redis Configuration (Optional)
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=

# Payment Configuration (For future activation)
PAYMENT_WEBHOOK_SECRET=your_webhook_secret
STRIPE_SECRET_KEY=sk_test_...

# System Configuration
OWNER_ID=your_admin_user_id
```

### 4. Database Setup
```bash
# Create database
createdb ecommerce_db

# Run migrations (if any)
npm run migrate

# Seed database with test data
node seed.js
```

### 5. Start the Server
```bash
# Development mode with auto-reload
npm run dev

# Production mode
npm start

# Clean start (kills existing processes)
npm run clean-dev
```

## 🧪 Testing

### Run All Tests
```bash
npm test
```

### Run Specific Test Suite
```bash
npm test tests/integration/auth.test.js
npm test tests/integration/fraudDetection.test.js
```

### Run Tests in Watch Mode
```bash
npm run test:watch
```

### Generate Coverage Report
```bash
npm run test:coverage
```

### Test Suites Available
- ✅ **Authentication** (`auth.test.js`) - 8 tests
- ✅ **Fraud Detection** (`fraudDetection.test.js`) - 6 tests
- ✅ **GraphQL Security** (`graphql.test.js`) - 4 tests
- ✅ **Data Retention** (`dataRetention.test.js`) - 5 tests
- ✅ **SSRF Protection** (`ssrf.test.js`) - 10 tests
- ✅ **Error Handling** (`errorHandling.test.js`) - 4 tests

**Total: 37 integration tests**

## 📚 API Documentation

### Swagger UI
Access interactive API documentation at:
```
http://localhost:5000/api-docs
```

### Health Check
```bash
curl http://localhost:5000/api/health
```

Response:
```json
{
  "status": "success",
  "message": "Server is healthy",
  "timestamp": "2025-12-08T20:00:00.000Z",
  "database": "connected",
  "redis": "connected"
}
```

### Main Endpoints

#### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login
- `POST /api/auth/logout` - Logout
- `GET /api/auth/me` - Get current user
- `POST /api/auth/refresh` - Refresh access token

#### Purchase Requests
- `GET /api/requests` - List all requests
- `POST /api/requests` - Create new request
- `GET /api/requests/:id` - Get request details
- `PUT /api/requests/:id` - Update request
- `POST /api/requests/:id/publish` - Publish request

#### Price Quotes
- `POST /api/requests/:id/quotes` - Submit quote
- `GET /api/quotes` - List seller's quotes
- `PUT /api/quotes/:id` - Update quote
- `DELETE /api/quotes/:id` - Withdraw quote

#### Admin
- `GET /api/admin/users` - List all users
- `PUT /api/admin/users/:id` - Update user
- `GET /api/admin/stats` - System statistics

## 🏗️ Project Structure

```
backend/
├── config/              # Configuration files
│   ├── index.js        # Centralized config
│   ├── redis.js        # Redis connection
│   └── swagger.js      # API documentation config
├── controllers/         # Route controllers
├── middleware/          # Express middleware
│   ├── authMiddleware.js
│   ├── errorHandler.js
│   └── rateLimitMiddleware.js
├── models/             # Sequelize models
├── routes/             # API routes
├── services/           # Business logic
├── utils/              # Utility functions
│   ├── errors.js       # Custom error classes
│   └── responseMessages.js  # Centralized messages
├── tests/              # Test suites
│   ├── integration/    # Integration tests
│   └── unit/          # Unit tests
├── migrations/         # Database migrations
├── server.js          # Application entry point
└── package.json       # Dependencies
```

## 🔒 Security Best Practices

### For Developers

1. **Never commit `.env` files**
   - Use `.env.example` as template
   - Keep secrets in environment variables

2. **Use `npm ci` for installations**
   ```bash
   npm run install-safe
   ```

3. **Run security audits regularly**
   ```bash
   npm audit
   npm audit fix
   ```

4. **Use custom error classes**
   ```javascript
   const { AuthenticationError } = require('../utils/errors');
   throw new AuthenticationError('Invalid credentials');
   ```

5. **Never expose sensitive data**
   - Don't send tokens in JSON body
   - Use HttpOnly cookies
   - Sanitize error messages in production

6. **Validate all inputs**
   - Use Joi or similar validation library
   - Check for SQL injection
   - Prevent XSS attacks

## 🚀 Deployment

### Production Checklist

- [ ] Set `NODE_ENV=production`
- [ ] Use strong `JWT_SECRET`
- [ ] Enable HTTPS
- [ ] Configure CORS properly
- [ ] Set up Redis for production
- [ ] Configure database connection pooling
- [ ] Set up monitoring (PM2, New Relic, etc.)
- [ ] Configure log rotation
- [ ] Set up automated backups
- [ ] Review and update rate limits
- [ ] Test payment integration
- [ ] Set up SSL certificates

### Using PM2
```bash
# Install PM2
npm install -g pm2

# Start application
pm2 start server.js --name ecommerce-api

# Monitor
pm2 monit

# View logs
pm2 logs

# Restart
pm2 restart ecommerce-api
```

## 📊 Monitoring

### Logs
Application logs are written to console. In production, use a log aggregation service:
- PM2 logs
- Winston + CloudWatch
- ELK Stack
- Datadog

### Metrics
Key metrics to monitor:
- Request rate
- Response time
- Error rate
- Database connection pool
- Redis connection status
- Memory usage
- CPU usage

## 🤝 Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md) for detailed guidelines.

### Quick Start for Contributors

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Write/update tests
5. Run tests: `npm test`
6. Submit a pull request

## 📝 License

Proprietary - All rights reserved

## 🆘 Support

For support, email support@example.com or create an issue in the repository.

## 📅 Changelog

### Version 2.0.0 (Current)
- ✅ Centralized configuration (P1.1)
- ✅ Jest testing framework (P1.2)
- ✅ Standardized error handling (P1.3)
- ✅ Comprehensive documentation (P1.4)
- ✅ Fraud detection system
- ✅ Payment integration (ready for activation)
- ✅ GraphQL API
- ✅ Socket.IO real-time notifications

### Version 1.0.0
- Initial release
- Basic CRUD operations
- User authentication
- Purchase request system

---

**Built with ❤️ by the Development Team**
