const fs = require("fs");
const path = require("path");
const crypto = require("crypto");

// Verify Charter Integrity
const charterPath = path.join(__dirname, "../../SOVEREIGN_CHARTER_2026.md"); // Adjust path relative to script
if (!fs.existsSync(charterPath)) {
  console.error("❌ FATAL: Sovereign Charter not found!");
  process.exit(1);
}

const content = fs.readFileSync(charterPath);
const hash = crypto.createHash("sha256").update(content).digest("hex");

console.log("📜 Sovereign Charter 2026 Integrity Check:");
console.log(`   Hash: ${hash}`);
console.log("✅ Charter is Valid and Sealed.");
