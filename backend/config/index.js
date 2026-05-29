const dotenv = require("dotenv");
const path = require("path");

// Load environment variables from root (.env is two levels up from backend/config/index.js)
// backend/config -> backend -> root
// Initialize Secrets from Vault (Simulated)
// Initialize Secrets from Vault (Real HashiCorp Integration)
require("../scripts/secrets-vault")();

dotenv.config({ path: path.join(__dirname, "../../.env") });

const config = {
  env: process.env.NODE_ENV || "development",
  ownerId: process.env.OWNER_ID,
  server: {
    port: parseInt(process.env.PORT, 10) || 5000,
    clientUrl: process.env.CLIENT_URL || "http://localhost:3000",
  },
  db: {
    database: process.env.DB_DATABASE,
    username: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    host: process.env.DB_HOST,
    dialect: "postgres",
    logging: false, // Default to false
    pool: {
      max:
        parseInt(process.env.DB_POOL_MAX, 10) ||
        (process.env.NODE_ENV === "test" ? 50 : 20),
      min:
        parseInt(process.env.DB_POOL_MIN, 10) ||
        (process.env.NODE_ENV === "test" ? 10 : 0),
      acquire: parseInt(process.env.DB_POOL_ACQUIRE, 10) || 30000,
      idle: parseInt(process.env.DB_POOL_IDLE, 10) || 10000,
    },
  },
  jwt: {
    secret: process.env.JWT_SECRET || "supersecret",
    accessExpiration: "15m",
    refreshExpiration: "7d",
  },
  redis: {
    host: process.env.REDIS_HOST || "localhost",
    port: parseInt(process.env.REDIS_PORT, 10) || 6379,
    password: process.env.REDIS_PASSWORD || undefined,
  },
  payment: {
    webhookSecret: process.env.PAYMENT_WEBHOOK_SECRET,
  },
  security: {
    corsOrigins:
      process.env.NODE_ENV === "production"
        ? [process.env.CLIENT_URL].filter(Boolean)
        : [
            process.env.CLIENT_URL || "http://localhost:3000",
            "http://127.0.0.1:3000",
            "http://localhost:3001",
          ],
  },
};

// Basic Validation for critical variables
const requiredEnvs = [
  "DB_DATABASE",
  "DB_USER",
  "DB_PASSWORD",
  "DB_HOST",
  "JWT_SECRET",
];
if (config.env === "production") {
  const missingEnvs = requiredEnvs.filter((key) => !process.env[key]);
  if (missingEnvs.length > 0) {
    console.error(
      `❌ CRITICAL: Missing required environment variables in production: ${missingEnvs.join(", ")}`,
    );
    // We might want to throw error in prod, but warn in dev
  }
} else {
  // Development warning
  const missingEnvs = requiredEnvs.filter((key) => !process.env[key]);
  if (missingEnvs.length > 0) {
    console.warn(
      `⚠️ Warning: Missing environment variables: ${missingEnvs.join(", ")}`,
    );
  }
}

console.log("--- CONFIG LOADED ---");
console.log("JWT SECRET:", config.jwt.secret);
console.log("---------------------");
module.exports = config;
