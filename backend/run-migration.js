const path = require("path");
require("dotenv").config({ path: path.join(__dirname, "../.env") });
const { exec } = require("child_process");

console.log("Environment Variables Loaded");
console.log("NODE_ENV:", process.env.NODE_ENV);
console.log("DATABASE_URL Exists:", !!process.env.DATABASE_URL);

if (process.env.DATABASE_URL) {
  const hiddenUrl = process.env.DATABASE_URL.replace(/:[^:]*@/, ":****@");
  console.log("Target DB:", hiddenUrl);
} else {
  console.error("❌ DATABASE_URL is missing!");
  // Verify file path
  const envPath = path.join(__dirname, "../.env");
  console.log("Expected .env path:", envPath);
  const fs = require("fs");
  if (fs.existsSync(envPath)) {
    console.log("✅ .env file found at path.");
    // Don't read content security policy
  } else {
    console.error("❌ .env file NOT found at path.");
  }
}

// Ensure NODE_ENV is set to development if generic
if (!process.env.NODE_ENV) {
  process.env.NODE_ENV = "development";
}

console.log("🚀 Starting Migration...");
const migrateCommand = "npx sequelize-cli db:migrate";

const child = exec(
  migrateCommand,
  { env: process.env },
  (error, stdout, stderr) => {
    if (stdout) console.log(stdout);
    if (stderr) console.error(stderr);
    if (error) {
      console.error("❌ Migration failed:", error);
      process.exit(1);
    }
    console.log("✅ Migration completed successfully");
  },
);
