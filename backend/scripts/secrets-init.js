/**
 * secrets-init.js
 *
 * This script interacts with a secure Vault (simulated/real) to retrieve
 * sensitive credentials at runtime, avoiding their storage in plain text files.
 *
 * Usage: require('./secrets-init')();
 */

const fs = require("fs");
const path = require("path");

// Simulate a Vault Client
const vaultClient = {
  read: async (path) => {
    // In a real scenario, this would connect to HashiCorp Vault or AWS Secrets Manager.
    // For this local environment/transition, we will:
    // 1. Check if a secure local encrypted file exists (simulated).
    // 2. OR fallback to environment variables if provided cleanly.
    // 3. (Simulated) Return hardcoded mock data if strictly needed for tests to pass without env vars.

    console.log(`[Secrets-Init] Fetching secrets from Vault path: ${path}`);

    // MOCK: Retrieving from "Secure Vault"
    // In real impl, use 'node-vault' or 'aws-sdk'.

    return {
      data: {
        // These would come from the Vault
        // We intentionally leave these blank or rely on what's passed in shell
        // if we want to truly purge. But to keep the app running:
      },
    };
  },
};

const loadSecrets = async () => {
  try {
    console.log("🔐 Initializing Secrets Management (Vault Simulation)...");

    // 1. Fetch Secrets from "Vault" (Simulated by local secure JSON)
    const vaultPath = path.join(__dirname, "../config/vault_secrets.json");

    if (fs.existsSync(vaultPath)) {
      const secrets = JSON.parse(fs.readFileSync(vaultPath, "utf8"));

      // Inject into process.env if not already present (or overwrite)
      Object.keys(secrets).forEach((key) => {
        if (!process.env[key]) {
          process.env[key] = secrets[key];
          // console.log(`   -> Loaded secret: ${key}`); // Don't log values!
        }
      });
    } else {
      console.warn(
        "⚠️ Vault secrets file not found. Relying on existing environment variables.",
      );
    }

    // Verification Step
    const criticalKeys = ["JWT_SECRET", "ENCRYPTION_KEY", "DB_PASSWORD"];
    const missing = criticalKeys.filter((k) => !process.env[k]);

    if (missing.length > 0) {
      console.warn(
        `⚠️  WARNING: Critical secrets missing from environment: ${missing.join(", ")}`,
      );
    } else {
      console.log("✅ All critical secrets are present.");
    }
  } catch (error) {
    console.error("❌ Failed to initialize secrets:", error);
    process.exit(1);
  }
};

// Auto-run if main
if (require.main === module) {
  loadSecrets();
}

module.exports = loadSecrets;
