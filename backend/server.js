const express = require('express');
const config = require('./config');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');



// D.1, D.2, D.3 Rate Limiter Middleware
const { apiLimiter } = require('./middleware/rateLimitMiddleware');
const cookieParser = require('cookie-parser');
const { RedisStore } = require('rate-limit-redis');
const { redisConnection: redisClient, isRedisAvailable } = require('./config/redis');

// GraphQL Imports
const { ApolloServer } = require('@apollo/server');
const { expressMiddleware } = require('@as-integrations/express4');
const { typeDefs } = require('./src/api/graphql/schema');
const { resolvers } = require('./src/api/graphql/resolvers');
const { context } = require('./src/api/graphql/context');

// Import initSequelize
const { initSequelize, sequelize } = require('./sequelize_setup');

const http = require('http');
const { Server } = require('socket.io');
const NotificationService = require('./services/notificationService');
const cacheService = require('./services/cacheService');

// Import Routes
const authRoutes = require('./routes/authRoutes');
const requestRoutes = require('./routes/requestRoutes');
const quoteRoutes = require('./routes/quoteRoutes');
const userRoutes = require('./routes/userRoutes');
const adminRoutes = require('./routes/adminRoutes');
const attachmentRoutes = require('./routes/attachmentRoutes');
const paymentRoutes = require('./routes/paymentRoutes');
const dealRoutes = require('./routes/dealRoutes');
const categoryRoutes = require('./routes/categoryRoutes');
const dashboardRoutes = require('./routes/dashboardRoutes');
const productRoutes = require('./routes/productRoutes');

// Import Scheduled Jobs (معطل - Redis غير متوفر)
// const { setupRepeatedJobs } = require('./queue/scheduledJobs');
// const { startSchedulerWorker } = require('./queue/schedulerWorker');

// Load env vars
const app = express();

// ==========================================
// 🕵️ MIDDLEWARE TIMING PROFILER (DIAGNOSTIC)
// ==========================================
// P2.2 Optimization: Disable in test mode to reduce overhead
if (process.env.NODE_ENV !== 'test') {
        const middlewareTiming = {};

        // 1. Start Timer (Must be FIRST)
        app.use((req, res, next) => {
                req._startTime = Date.now();
                req._startHrTime = process.hrtime();
                next();
        });

        // 2. End Timer & Log
        app.use((req, res, next) => {
                const end = () => {
                        const duration = Date.now() - req._startTime;

                        // Log slow requests (>500ms) to console for immediate visibility
                        if (duration > 500) {
                                const time = new Date().toISOString().split('T')[1].slice(0, 8);
                                console.log(`[${time}] ⚠️ SLOW: ${req.method} ${req.url} - ${duration}ms`);
                        }
                };

                res.on('finish', end);
                next();
        });
}
// ==========================================

const PORT = config.server.port;

// Trust proxy for rate limit
app.set('trust proxy', 1);

// Memory Monitoring (Emergency Fix)
if (process.env.NODE_ENV === 'test' || process.env.NODE_ENV === 'development') {
        setInterval(() => {
                const used = process.memoryUsage();
                console.log(`[Monitor] Memory RSS: ${Math.round(used.rss / 1024 / 1024)}MB | Heap: ${Math.round(used.heapUsed / 1024 / 1024)}MB`);
        }, 5000);
}

// Middleware - Enhanced Security Headers
app.use(helmet({
        contentSecurityPolicy: {
                directives: {
                        defaultSrc: ["'self'"],
                        scriptSrc: ["'self'", "'unsafe-inline'", "https://cdn.jsdelivr.net"],
                        styleSrc: ["'self'", "'unsafe-inline'"],
                        imgSrc: ["'self'", "data:", "https:"],
                        connectSrc: ["'self'", "http://localhost:5000", "https://studio.apollographql.com"],
                        frameSrc: ["'self'", "https://studio.apollographql.com"],
                        fontSrc: ["'self'"],
                        objectSrc: ["'none'"],
                        mediaSrc: ["'self'"],
                        formAction: ["'self'"],
                },
        },
        hsts: {
                maxAge: 31536000, // 1 year
                includeSubDomains: true,
                preload: true
        },
        crossOriginEmbedderPolicy: false,
        crossOriginResourcePolicy: { policy: "cross-origin" },
        referrerPolicy: { policy: "strict-origin-when-cross-origin" }
}));

app.use(cors({
        origin: ['http://localhost:3000', 'http://127.0.0.1:3000', 'http://localhost:3001', 'http://127.0.0.1:3001', ...config.security.corsOrigins],
        methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
        allowedHeaders: ['Content-Type', 'Authorization'],
        credentials: true
}));

// P2.2 Optimization: Conditional logging based on environment
if (process.env.NODE_ENV === 'production') {
        app.use(morgan('combined')); // Detailed logs in production
} else if (process.env.NODE_ENV === 'development') {
        app.use(morgan('dev')); // Concise logs in development
}
// No logging in 'test' mode for maximum performance
app.use(express.json({
        limit: '10mb',
        verify: (req, res, buf) => {
                req.rawBody = buf;
        }
}));
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// Security Middleware
const promptGuard = require('./middleware/promptGuard');
const sanitize = require('./middleware/sanitize');
const { sanitizeInput } = require('./middleware/securityMiddleware');

app.use(promptGuard);
app.use(sanitize);
app.use(sanitizeInput);

// D.3 Rate Limiting
// Apply to all /api requests
app.use('/api', apiLimiter);

app.get('/api/health', async (req, res) => {
        const cacheKey = 'health:response';

        try {
                const cached = await cacheService.get(cacheKey);

                if (cached) {
                        res.setHeader('X-Cache', 'HIT');
                        return res.status(200).json(cached);
                }

                const response = {
                        status: 'success',
                        message: 'Server is healthy',
                        timestamp: new Date().toISOString(),
                        database: 'connected',
                        redis: (await cacheService.health()).status
                };

                await cacheService.set(cacheKey, response, 5); // Cache for 5 seconds
                res.setHeader('X-Cache', 'MISS');
                res.status(200).json(response);
        } catch (err) {
                // Fallback for any cache errors
                res.status(200).json({ status: 'success', mode: 'fallback' });
        }
});

app.get('/api/health/advanced', async (req, res) => {
        const startTime = Date.now();
        try {
                // Test Database Connectivity
                await sequelize.authenticate();
                // Simple query to test query execution
                await sequelize.query('SELECT 1+1 AS result');

                const dbLatency = Date.now() - startTime;

                res.status(200).json({
                        status: 'success',
                        component: 'backend',
                        checks: {
                                database: {
                                        status: 'operational',
                                        latency: `${dbLatency}ms`
                                },
                                redis: {
                                        status: isRedisAvailable() ? 'operational' : 'unavailable',
                                }
                        },
                        timestamp: new Date().toISOString()
                });
        } catch (error) {
                console.error('Health Check Failed:', error);
                res.status(503).json({
                        status: 'error',
                        message: 'Service Unavailable',
                        details: error.message
                });
        }
});

// API Documentation (Swagger)
const { swaggerUi, swaggerSpec } = require('./config/swagger');
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec, {
        customCss: '.swagger-ui .topbar { display: none }',
        customSiteTitle: 'E-Commerce API Documentation'
}));

// Create HTTP server
const httpServer = http.createServer(app);

// Start Server
const startServer = async (startListening = true) => {
        try {
                // 0. Sovereign Production Hard Gates (Fail-Fast)
                if (process.env.NODE_ENV === 'production') {
                        const requiredSecrets = ['OWNER_ID', 'JWT_SECRET', 'SIGNATURE_KEY'];
                        const missing = requiredSecrets.filter(k => !process.env[k]);
                        if (missing.length > 0) {
                                console.error('⛔ FATAL: Missing Sovereign Secrets in Production:', missing);
                                process.exit(1);
                        }
                        if (process.env.OWNER_BOOTSTRAP_ENABLED === 'true') {
                                console.error('⛔ FATAL: OWNER_BOOTSTRAP_ENABLED must be FALSE in Production.');
                                process.exit(1);
                        }
                }

                // 1. Initialize Database
                await initSequelize();
                console.log('✅ Database initialized successfully.');

                // 2. Initialize Background Jobs (If Redis Available)
                // 2. Initialize Background Jobs (If Redis Available)
                if (isRedisAvailable()) {
                        // require('./jobs/cronJobs'); // File missing
                        console.log('✅ Background jobs initialized (Skipped missing module)');
                } else {
                        console.log('🚫 Background jobs disabled (Redis unavailable)');
                }

                // 3. Setup Apollo Server (GraphQL)
                const depthLimit = require('graphql-depth-limit');

                const server = new ApolloServer({
                        typeDefs,
                        resolvers,
                        introspection: config.env !== 'production', // J.1 Disable introspection in production
                        validationRules: [depthLimit(10)], // J.2 Limit query depth to 10
                });

                await server.start();

                // Apply GraphQL Middleware
                app.use(
                        '/graphql',
                        cors({ origin: config.security.corsOrigins, credentials: true }),
                        express.json(),
                        expressMiddleware(server, {
                                context: context,
                        }),
                );

                console.log('🚀 Apollo GraphQL Server ready at /graphql');

                // 4. Initialize Socket.IO
                const io = new Server(httpServer, {
                        cors: {
                                origin: config.security.corsOrigins,
                                methods: ['GET', 'POST'],
                                credentials: true
                        }
                });

                // Initialize Notification Service
                NotificationService.init(io);
                console.log('🔌 Socket.IO initialized');

                // 5. Register REST API Routes
                app.use('/api/auth', authRoutes);
                app.use('/api/requests', requestRoutes);
                app.use('/api/quotes', quoteRoutes);
                app.use('/api/users', userRoutes);
                app.use('/api/admin', adminRoutes);
                app.use('/api/attachments', attachmentRoutes);
                app.use('/api/payments', paymentRoutes);
                app.use('/api/deals', dealRoutes);
                app.use('/api/categories', categoryRoutes);
                app.use('/api/dashboard', dashboardRoutes);
                app.use('/api/products', productRoutes);

                // Owner Routes (Feature 1) - With Kill Switch
                const ownerRoutes = require('./routes/ownerRoutes');
                app.use('/api/owner', (req, res, next) => {
                        // 🔒 Sovereign Kill Switch
                        if (process.env.OWNER_PANEL_ENABLED === 'false') {
                                return res.status(503).json({
                                        error: 'Sovereign Interface is currently DISABLED via global policy.',
                                        code: 'SOVEREIGN_KILL_SWITCH_ACTIVE'
                                });
                        }
                        next();
                }, ownerRoutes);

                // 6. Error Handling (Must be after routes)
                const { notFound, errorHandler } = require('./middleware/errorHandler');
                app.use((req, res, next) => {
                        if (req.path === '/graphql') return next();
                        notFound(req, res, next);
                });
                app.use(errorHandler);

                // 7. Start Listening
                if (startListening) {
                        httpServer.listen(PORT, () => {
                                console.log(`🚀 Server running on port ${PORT}`);
                                console.log(`🔗 http://localhost:${PORT}`);
                                console.log('📝 API endpoints ready:');
                                console.log('   - /graphql (GraphQL API)');
                                console.log('   - /api/auth (Authentication)');
                                console.log('   - /api/requests (Purchase Requests)');
                                console.log('   - /api/quotes (Price Quotes)');
                                console.log('   - /api/attachments (Protected Files)');
                                console.log('   - /api/admin (Admin Dashboard)');
                                console.log('   - /api/dashboard (Dashboards)');
                                console.log('   - /api/products (Seller Inventory)');
                        });
                }
        } catch (error) {
                console.error('❌ Failed to start server:', error);
                throw error; // Let Jest handle the error instead of exiting
        }
};

if (require.main === module) {
        startServer();
}

app.startServer = startServer;
module.exports = app;