const fs = require("fs");
const path = require("path");
const Redis = require("ioredis");
const dotenv = require("dotenv");

// Load environment variables
dotenv.config({ path: path.join(__dirname, "../.env") });

const isProd = process.env.NODE_ENV === "production";

/**
 * 🛡️ SOVEREIGN PRE-FLIGHT CHECK
 * Mandatory execution before system initialization.
 * Non-negotiable security and infrastructure validation.
 */
const runChecks = async () => {
  console.log("🛡️  Starting Sovereign Pre-Flight Checks...");
  let failed = false;

  // 1. Validate Environment Variables
  const requiredEnvs = [
    "NODE_ENV",
    "DB_DATABASE",
    "DB_USER",
    "DB_PASSWORD",
    "DB_HOST",
    "JWT_SECRET",
    "REDIS_HOST",
    "OWNER_ID",
    "DB_ENCRYPTION_KEY",
  ];

  console.log("🔍 [1/4] Validating Environment Schema...");
  const missing = requiredEnvs.filter((key) => {
    if (key === "DB_PASSWORD" && !isProd) return false;
    return !process.env[key];
  });
  if (missing.length > 0) {
    console.error(
      `❌ CRITICAL: Missing mandatory environment variables: ${missing.join(", ")}`,
    );
    failed = true;
  } else {
    // 🟥 SOVEREIGN REGEX: Validate OWNER_ID format (UUID)
    const uuidRegex =
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(process.env.OWNER_ID)) {
      console.error("❌ CRITICAL: OWNER_ID must be a valid UUID format.");
      failed = true;
    }

    // 🟥 SOVEREIGN REGEX: Validate DB_ENCRYPTION_KEY format (64 hex chars)
    const keyRegex = /^[0-9a-f]{64}$/i;
    if (!keyRegex.test(process.env.DB_ENCRYPTION_KEY)) {
      console.error(
        "❌ CRITICAL: DB_ENCRYPTION_KEY must be a 64-character hex string (AES-256).",
      );
      failed = true;
    }

    if (!failed) {
      console.log("✅ Environment Schema & Sovereign Keys Validated.");
    }
  }

  // 2. Validate SSL Certificates (Production ONLY)
  if (isProd) {
    console.log("🔒 [2/4] Validating SSL Infrastructure (Production Mode)...");
    const certDir = path.join(__dirname, "../certs");
    const certFiles = ["server.crt", "server.key"];

    if (!fs.existsSync(certDir)) {
      console.error(
        '❌ CRITICAL: SSL Certificate Directory "certs/" is missing in production.',
      );
      failed = true;
    } else {
      const missingCerts = certFiles.filter(
        (file) => !fs.existsSync(path.join(certDir, file)),
      );
      if (missingCerts.length > 0) {
        console.error(
          `❌ CRITICAL: Missing mandatory SSL files: ${missingCerts.join(", ")}`,
        );
        failed = true;
      } else {
        console.log("✅ SSL Infrastructure Verified.");
      }
    }
  } else {
    console.log("⚠️  [2/4] SSL Check skipped (Non-Production Environment).");
  }

  // 3. Validate Redis Connection
  console.log("🚀 [3/4] Validating Redis Infrastructure...");
  const redis = new Redis({
    host: process.env.REDIS_HOST || "localhost",
    port: process.env.REDIS_PORT || 6379,
    password: process.env.REDIS_PASSWORD || undefined,
    connectTimeout: 5000,
    retryStrategy: () => null, // Don't retry in pre-flight
  });

  try {
    await new Promise((resolve, reject) => {
      redis.on("connect", () => {
        redis.disconnect();
        resolve();
      });
      redis.on("error", (err) => {
        reject(err);
      });
      // Timeout safety
      setTimeout(() => reject(new Error("Redis Connection Timeout")), 6000);
    });
    console.log("✅ Redis Infrastructure Verified.");
  } catch (err) {
    if (isProd) {
      console.error(`❌ CRITICAL: Redis Connection Failed: ${err.message}`);
      failed = true;
    } else {
      console.warn(
        `⚠️  [DEVELOPMENT] Redis Connection Failed: ${err.message}. System will continue without Redis features.`,
      );
      redis.disconnect();
    }
  }

  // 4. Validate Database Integrity & Synchronization
  console.log("📊 [4/4] Validating Database Integrity & Sync Status...");
  const { sequelize } = require("../sequelize_setup");
  try {
    await sequelize.authenticate();

    // Check if required core tables exist
    const tables = await sequelize.getQueryInterface().showAllTables();
    const requiredTables = [
      "Users",
      "PurchaseRequests",
      "PriceQuotes",
      "ActionLogs",
    ];
    const missingTables = requiredTables.filter((t) => !tables.includes(t));

    if (missingTables.length > 0) {
      if (isProd) {
        console.error(
          `❌ CRITICAL: Database is OUT OF SYNC. Missing tables: ${missingTables.join(", ")}`,
        );
        console.error(
          "📊 Please run migrations/sync before starting the server.",
        );
        failed = true;
      } else {
        console.warn(
          `⚠️  [DEVELOPMENT] Database is OUT OF SYNC. Missing tables: ${missingTables.join(", ")}`,
        );
        console.warn('📊 Run "node sync_db.js" to fix.');
      }
    } else {
      console.log("✅ Database Integrity Verified.");
    }
  } catch (dbErr) {
    console.error(
      `❌ CRITICAL: Database Connection/Integrity Check Failed: ${dbErr.message}`,
    );
    failed = true;
  }

  // 🏁 FINAL VERDICT
  if (failed) {
    console.error("\n⛔ SOVEREIGN PRE-FLIGHT CHECK FAILED.");
    console.error(
      "🚨 System boot sequence terminated to prevent insecure state.",
    );
    process.exit(1);
  } else {
    console.log(
      "\n🌟 SOVEREIGN PRE-FLIGHT CHECK PASSED. SYSTEM SECURE FOR BOOT.",
    );
  }
};

runChecks();
