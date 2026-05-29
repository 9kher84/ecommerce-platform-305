const crypto = require("crypto");

/**
 * 🛡️ Sovereign Encryption Utility (AES-256-GCM)
 * Provides high-security authenticated encryption for data-at-rest.
 */

const ALGORITHM = "aes-256-gcm";
const IV_LENGTH = 16;
const AUTH_TAG_LENGTH = 16;
const ENCRYPTION_KEY = process.env.DB_ENCRYPTION_KEY;

/**
 * Encrypt a string
 */
const encrypt = (text) => {
  if (!text || typeof text !== "string") return text;
  if (!ENCRYPTION_KEY)
    throw new Error(
      "❌ CRITICAL: DB_ENCRYPTION_KEY is not defined in environment.",
    );

  const iv = crypto.randomBytes(IV_LENGTH);
  const key = Buffer.from(ENCRYPTION_KEY, "hex");
  const cipher = crypto.createCipheriv(ALGORITHM, key, iv);

  let encrypted = cipher.update(text, "utf8", "hex");
  encrypted += cipher.final("hex");

  const authTag = cipher.getAuthTag().toString("hex");
  return `${iv.toString("hex")}:${authTag}:${encrypted}`;
};

/**
 * Decrypt a string
 */
const decrypt = (encryptedText) => {
  if (
    !encryptedText ||
    typeof encryptedText !== "string" ||
    !encryptedText.includes(":")
  )
    return encryptedText;
  if (!ENCRYPTION_KEY)
    throw new Error(
      "❌ CRITICAL: DB_ENCRYPTION_KEY is not defined in environment.",
    );

  try {
    const [ivHex, authTagHex, encryptedDataHex] = encryptedText.split(":");
    const iv = Buffer.from(ivHex, "hex");
    const authTag = Buffer.from(authTagHex, "hex");
    const key = Buffer.from(ENCRYPTION_KEY, "hex");

    const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
    decipher.setAuthTag(authTag);

    let decrypted = decipher.update(encryptedDataHex, "hex", "utf8");
    decrypted += decipher.final("utf8");
    return decrypted;
  } catch (err) {
    console.error("⚠️ Decryption failed:", err.message);
    return encryptedText;
  }
};

/**
 * Generate a Blind Index (HMAC-SHA256) for searchability
 */
const generateBlindIndex = (text) => {
  if (!text || typeof text !== "string") return text;
  const SEARCH_HASH_KEY = process.env.SEARCH_HASH_KEY;
  if (!SEARCH_HASH_KEY)
    throw new Error("❌ CRITICAL: SEARCH_HASH_KEY is not defined.");

  return crypto
    .createHmac("sha256", Buffer.from(SEARCH_HASH_KEY, "hex"))
    .update(text.trim())
    .digest("hex");
};

module.exports = { encrypt, decrypt, generateBlindIndex };
