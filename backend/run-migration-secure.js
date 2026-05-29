// backend/run-migration-secure.js
const config = require("./config/index");
const { exec } = require("child_process");
const path = require("path");

console.log("🔒 Secure Migration Launcher");
console.log("📁 Current directory:", __dirname);
console.log("🎯 Target DB:", config.db.database);
console.log("👤 DB User:", config.db.username);
console.log("🌐 DB Host:", config.db.host);

// Check if credentials loaded (fail-fast if undefined)
if (!config.db.username || !config.db.password) {
  console.error("❌ Credentials missing in config!");
  process.exit(1);
}

// DO NOT log password!

// Construct Secure Connection String
const dbUrl = `postgres://${config.db.username}:${config.db.password}@${config.db.host}:${config.db.port || 5432}/${config.db.database}`;

console.log("🚀 Starting secure migration...");

// Use logic that mimics app environment
const env = {
  ...process.env,
  NODE_ENV: "development",
  DATABASE_URL: dbUrl, // Override/Pass URL directly
};

// Execute Migration
exec(
  `npx sequelize-cli db:migrate --url "${dbUrl}"`,
  {
    cwd: __dirname,
    env,
  },
  (error, stdout, stderr) => {
    console.log("=".repeat(50));
    if (error) {
      console.error("❌ MIGRATION FAILED");
      console.error("Error Key:", error.message);
      // Be careful printing stderr if it contains sensitive info, usually sequelize is clean
      if (stderr) console.error("Stderr:", stderr);
      console.log("=".repeat(50));
      process.exit(1);
    }

    console.log("✅ MIGRATION SUCCESS");
    console.log(stdout);
    console.log("=".repeat(50));

    // Verify Status
    exec(
      `npx sequelize-cli db:migrate:status --url "${dbUrl}"`,
      { env },
      (statusError, statusStdout) => {
        console.log("📋 Migration Status:");
        console.log(statusStdout || "Could not retrieve status");
        console.log("=".repeat(50));
        console.log("🏁 Ready for Server Restart.");
      },
    );
  },
);
