const express = require("express");
const config = require("./config");
const cors = require("cors");
const helmet = require("helmet");
const morgan = require("morgan");

// D.1, D.2, D.3 Rate Limiter Middleware
const { apiLimiter } = require("./middleware/rateLimitMiddleware");
const cookieParser = require("cookie-parser");
const { RedisStore } = require("rate-limit-redis");
const {
  redisConnection: redisClient,
  isRedisAvailable,
} = require("./config/redis");
const logger = require("./utils/logger"); // LOGGING
const errorMonitor = require("./middleware/errorMonitor"); // ERROR MONITORING
const maintenanceMiddleware = require("./middleware/maintenanceMiddleware");

// GraphQL Imports
const { ApolloServer } = require("@apollo/server");
const { expressMiddleware } = require("@as-integrations/express4");
const { typeDefs } = require("./src/api/graphql/schema");
const { resolvers } = require("./src/api/graphql/resolvers");
const { context } = require("./src/api/graphql/context");

// Import initSequelize
const { initSequelize, sequelize } = require("./sequelize_setup");

const http = require("http");
const { Server } = require("socket.io");
const NotificationService = require("./services/notificationService");
const cacheService = require("./services/cacheService");

// Import Routes
const authRoutes = require("./routes/authRoutes");
const requestRoutes = require("./routes/requestRoutes");
const quoteRoutes = require("./routes/quoteRoutes");
const userRoutes = require("./routes/userRoutes");
const adminRoutes = require("./routes/adminRoutes");
const attachmentRoutes = require("./routes/attachmentRoutes");
const paymentRoutes = require("./routes/paymentRoutes");
const dealRoutes = require("./routes/dealRoutes");
const categoryRoutes = require("./routes/categoryRoutes");
const dashboardRoutes = require("./routes/dashboardRoutes");
const agentRoutes = require("./routes/agentRoutes");
const productRoutes = require("./routes/productRoutes");
const chatRoutes = require("./routes/chatRoutes");
const invoiceRoutes = require("./routes/invoiceRoutes");

// Load env vars
const app = express();

// Load Error Monitor EARLY
app.use(errorMonitor);

/**
 * 🛡️ SOVEREIGN EMERGENCY LOCK (Dual-Layer Hardening)
 * Logic Resiliency: Master Kill-Switch for active defense.
 * Checks for SYSTEM_STATUS env OR existence of .EMERGENCY_LOCK file.
 */
app.use((req, res, next) => {
  const fs = require("fs");
  const path = require("path");
  const status = process.env.SYSTEM_STATUS;
  const ownerIp = process.env.OWNER_IP;
  const lockFileExists = fs.existsSync(path.join(__dirname, ".EMERGENCY_LOCK"));

  if (status === "LOCKED" || status === "UNDER_ATTACK" || lockFileExists) {
    const clientIp = req.ip || req.connection.remoteAddress;

    // Only the Sovereign Owner's IP can bypass the lock
    if (ownerIp && clientIp === ownerIp) {
      return next();
    }

    console.error(
      `🚨 SYSTEM LOCK ACTIVE: Rejecting request from ${clientIp}. Trigger: ${lockFileExists ? "LOCK_FILE" : status}`,
    );
    return res.status(503).json({
      success: false,
      message: "النظام تحت الصيانة الطارئة - نعتذر عن الإزعاج",
      code: "SOVEREIGN_SYSTEM_LOCKED",
    });
  }
  next();
});

// ==========================================
// 🕵️ MIDDLEWARE TIMING PROFILER (DIAGNOSTIC)
// ==========================================
if (process.env.NODE_ENV !== "test") {
  app.use((req, res, next) => {
    req._startTime = Date.now();
    next();
  });

  app.use((req, res, next) => {
    const end = () => {
      const duration = Date.now() - req._startTime;
      // Log using Winston
      if (res.statusCode >= 500) {
        logger.error(
          `${req.method} ${req.url} - ${res.statusCode} - ${duration}ms`,
        );
      } else if (duration > 500) {
        logger.warn(`SLOW REQUEST: ${req.method} ${req.url} - ${duration}ms`);
      } else {
        logger.info(
          `${req.method} ${req.url} - ${res.statusCode} - ${duration}ms`,
        );
      }
    };
    res.on("finish", end);
    next();
  });
}
// ==========================================

const PORT = config.server.port;
app.set("trust proxy", 1);

// Middleware - Enhanced Sovereign Security Headers (Immutable CSP)
app.use(
  helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc: ["'self'", "https://cdn.jsdelivr.net"],
        styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
        imgSrc: ["'self'", "data:", "https:"],
        connectSrc: [
          "'self'",
          ...config.security.corsOrigins,
          "https://studio.apollographql.com",
        ],
        frameSrc: ["'self'", "https://studio.apollographql.com"],
        fontSrc: ["'self'", "https://fonts.gstatic.com"],
        objectSrc: ["'none'"],
        upgradeInsecureRequests: [],
      },
    },
    hsts: { maxAge: 31536000, includeSubDomains: true, preload: true },
    crossOriginEmbedderPolicy: false,
    crossOriginResourcePolicy: { policy: "same-site" },
    referrerPolicy: { policy: "no-referrer-when-downgrade" },
  }),
);

// Strictly Environment-Controlled CORS
app.use(
  cors({
    origin: (origin, callback) => {
      const allowed = config.security.corsOrigins;
      if (!origin || allowed.indexOf(origin) !== -1) {
        callback(null, true);
      } else {
        console.error(
          `🚨 CORS BLOCKED: Origin ${origin} is NOT in the sovereign allowlist.`,
        );
        callback(new Error("CORS Policy Violation: Origin not permitted."));
      }
    },
    methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization", "X-Requested-With"],
    credentials: true,
  }),
);

app.use(
  express.json({
    limit: "10mb",
    verify: (req, res, buf) => {
      req.rawBody = buf;
    },
  }),
);
app.use(maintenanceMiddleware);
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// Security Middleware
const promptGuard = require("./middleware/promptGuard");
const sanitize = require("./middleware/sanitize");
const { sanitizeInput } = require("./middleware/securityMiddleware");

app.use(promptGuard);
app.use(sanitize);
app.use(sanitizeInput);

const aiOutputSanitizer = require("./middleware/aiOutputSanitizer");
if (process.env.NODE_ENV === "production") {
  app.use(aiOutputSanitizer);
}

app.use("/api", apiLimiter);

// 🩺 SOVEREIGN HEALTH CHECK
app.get("/api/health", async (req, res) => {
  // 1. Basic Up check
  const health = {
    status: "UP",
    timestamp: new Date().toISOString(),
    checks: [],
  };

  // 2. Database Check
  try {
    await sequelize.authenticate();
    health.checks.push({ name: "Database", status: "UP" });
  } catch (e) {
    health.status = "DOWN";
    health.checks.push({ name: "Database", status: "DOWN", error: e.message });
  }

  // 3. Redis Check
  const redisStatus = isRedisAvailable() ? "UP" : "DOWN";
  health.checks.push({ name: "Redis", status: redisStatus });
  if (redisStatus === "DOWN") health.status = "DEGRADED";

  // 4. Disk & Memory Check (Simulated for robustness without extra libs)
  const usedMem = process.memoryUsage().rss / 1024 / 1024;
  health.checks.push({
    name: "Memory",
    status: usedMem < 1024 ? "UP" : "WARN",
    details: `${Math.round(usedMem)}MB`,
  });

  // Disk Simulation (Assume valid if we can write to /tmp or similar)
  // Here we just pass "Disk Space" as OK usually unless 500 error happens elsewhere
  health.checks.push({
    name: "DiskSpace",
    status: "UP",
    details: "Checked (Simulated)",
  });

  const code = health.status === "DOWN" ? 503 : 200;
  res.status(code).json(health);
});

// Advanced Stats
app.get("/api/health/advanced", async (req, res) => {
  // ... logic for advanced details ...
  res
    .status(200)
    .json({ status: "OK", note: "See /api/health for sovereign standard" });
});

// API Documentation (Swagger)
const { swaggerUi, swaggerSpec } = require("./config/swagger");
app.use(
  "/api-docs",
  swaggerUi.serve,
  swaggerUi.setup(swaggerSpec, {
    customCss: ".swagger-ui .topbar { display: none }",
    customSiteTitle: "Sovereign API Documentation",
  }),
);

// Create HTTP server
const httpServer = http.createServer(app);

// Shared reference for graceful shutdown
let gracefulShutdownHandler;

// Start Server
const startServer = async (startListening = true) => {
  try {
    // 0. Sovereign Production Hard Gates (Fail-Fast)
    if (process.env.NODE_ENV === "production") {
      const requiredSecrets = ["OWNER_ID", "JWT_SECRET", "SIGNATURE_KEY"];
      const missing = requiredSecrets.filter((k) => !process.env[k]);
      if (missing.length > 0) {
        console.error(
          "⛔ FATAL: Missing Sovereign Secrets in Production:",
          missing,
        );
        process.exit(1);
      }
      if (process.env.OWNER_BOOTSTRAP_ENABLED === "true") {
        console.error(
          "⛔ FATAL: OWNER_BOOTSTRAP_ENABLED must be FALSE in Production.",
        );
        process.exit(1);
      }
    }

    // 1. Initialize Database
    await initSequelize();
    console.log("✅ Database initialized successfully.");

    // 2. Initialize Background Jobs (If Redis Available)
    if (isRedisAvailable()) {
      require("./jobs/invoiceCron");
      console.log("✅ Background jobs initialized");
    } else {
      console.log("🚫 Background jobs disabled (Redis unavailable)");
    }

    // 3. Setup Apollo Server (GraphQL)
    const MemoryWatchdog = require("./services/memoryWatchdog");
    if (process.env.NODE_ENV !== "test") {
      // Don't run in transient tests
      MemoryWatchdog.start();
    }

    const depthLimit = require("graphql-depth-limit");

    const server = new ApolloServer({
      typeDefs,
      resolvers,
      introspection: config.env !== "production", // J.1 Disable introspection in production
      validationRules: [depthLimit(10)], // J.2 Limit query depth to 10
    });

    await server.start();

    // Apply GraphQL Middleware
    app.use(
      "/graphql",
      cors({ origin: config.security.corsOrigins, credentials: true }),
      express.json(),
      expressMiddleware(server, {
        context: context,
      }),
    );

    console.log("🚀 Apollo GraphQL Server ready at /graphql");

    // 4. Initialize Socket.IO
    const io = new Server(httpServer, {
      cors: {
        origin: config.security.corsOrigins,
        methods: ["GET", "POST"],
        credentials: true,
      },
    });

    // Initialize Notification Service
    NotificationService.init(io);

    // Initialize Chat Handler (Sovereign Chat Engine)
    const ChatHandler = require("./socket/chatHandler");
    const chatHandler = new ChatHandler(io);
    chatHandler.initialize();
    console.log("💬 Chat Engine initialized");

    console.log("🔌 Socket.IO initialized");

    // 5. Register REST API Routes
    app.use("/api/auth", authRoutes);
    app.use("/api/requests", requestRoutes);
    app.use("/api/quotes", quoteRoutes);
    app.use("/api/users", userRoutes);
    app.use("/api/admin", adminRoutes);
    app.use("/api/attachments", attachmentRoutes);
    app.use("/api/payments", paymentRoutes);
    app.use("/api/deals", dealRoutes);
    app.use("/api/categories", categoryRoutes);
    app.use("/api/dashboard", dashboardRoutes);
    app.use("/api/agents", agentRoutes);
    app.use("/api/products", productRoutes);
    app.use("/api/chat", chatRoutes);
    app.use("/api/invoice", invoiceRoutes);

    // ✅ Routes مضافة حديثاً (كانت غير مسجلة)
    const notificationRoutes = require("./routes/notificationRoutes");
    app.use("/api/notifications", notificationRoutes);

    const ratingRoutes = require("./routes/ratingRoutes");
    app.use("/api/ratings", ratingRoutes);

    // 🧪 INTERNAL KILL SWITCH (Drill Testing Only)
    if (process.env.NODE_ENV === "development") {
      app.post("/api/internal/shutdown-drill", (req, res) => {
        console.log("🧪 Kill Switch Helper Activated");
        if (gracefulShutdownHandler) {
          res.status(200).send("Shutdown Initiated");
          gracefulShutdownHandler("MANUAL_DRILL_TRIGGER");
        } else {
          res.status(500).send("Shutdown Handler Not Ready");
        }
      });
    }

    // Owner Routes (Feature 1) - With Kill Switch
    const ownerRoutes = require("./routes/ownerRoutes");
    app.use(
      "/api/owner",
      (req, res, next) => {
        // 🔒 Sovereign Kill Switch
        if (process.env.OWNER_PANEL_ENABLED === "false") {
          return res.status(503).json({
            error:
              "Sovereign Interface is currently DISABLED via global policy.",
            code: "SOVEREIGN_KILL_SWITCH_ACTIVE",
          });
        }
        next();
      },
      ownerRoutes,
    );

    const supervisorRoutes = require("./routes/supervisorRoutes");
    app.use("/api/supervisor", supervisorRoutes);

    const mcpRoutes = require("./routes/mcpRoutes");
    app.use("/mcp", mcpRoutes);

    // 6. Error Handling (Must be after routes)
    const { notFound, errorHandler } = require("./middleware/errorHandler");
    app.use((req, res, next) => {
      if (req.path === "/graphql") return next();
      notFound(req, res, next);
    });
    app.use(errorHandler);
    // FIXME: This breaks when the value is null.


    // 7. Start Listening
    if (startListening) {
      // The magic starts here. Or ends. Depends on your perspective.
      const server = httpServer.listen(PORT, () => {
        console.log(`🚀 Server running on port ${PORT}`);
        console.log(`🔗 http://localhost:${PORT}`);
        console.log("📝 API endpoints ready:");
        console.log("   - /graphql (GraphQL API)");
        console.log("   - /api/auth (Authentication)");
        console.log("   - /api/requests (Purchase Requests)");
      });

      // 8. SOVEREIGN GRACEFUL SHUTDOWN
      const gracefulShutdown = async (signal) => {
        console.log(`\n🛑 Received ${signal}. Starting Graceful Shutdown...`);

        // A. Stop accepting new HTTP requests
        server.close(async () => {
          console.log("   1. HTTP Server closed.");

          try {
            // B. Disconnect Database
            await sequelize.close();
            console.log("   2. Database connections closed.");

            // C. Disconnect Redis
            if (isRedisAvailable()) {
              const client = require("./config/redis").getRedisClient();
              if (client) {
                await client.quit();
                console.log("   3. Redis connection closed.");
              }
            }

            console.log("✅ Sovereign Clean Exit Completed. Goodbye.");
            process.exit(0);
          } catch (err) {
            console.error("❌ Error during shutdown:", err);
            process.exit(1);
          }
        });

        // Force forceful exit if graceful shutdown takes too long (10s)
        setTimeout(() => {
          console.error(
            "⚠️  Could not close connections in time, forcefully shutting down",
          );
          process.exit(1);
        }, 10000);
      };

      gracefulShutdownHandler = gracefulShutdown;

      process.on("SIGTERM", () => gracefulShutdown("SIGTERM"));
      process.on("SIGINT", () => gracefulShutdown("SIGINT"));
    }
  } catch (error) {
    console.error("❌ Failed to start server:", error);
    throw error; // Let Jest handle the error instead of exiting
  }
};

if (require.main === module) {
  startServer();
}

app.startServer = startServer;
module.exports = app;
// restart trigger for nodemon

