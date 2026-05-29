const crypto = require("crypto");
const {
  SmartInventory,
  Product,
  PurchaseRequest,
  User,
  Sequelize,
} = require("../sequelize_setup");
const { Op } = Sequelize;
const { encrypt, decrypt } = require("../utils/encryption");
const AppError = require("../utils/appError");

/**
 * 🛡️ Sovereign Warehouse Access Service - V2 HARDENED
 * Implements HMAC Signatures & Ownership Verification.
 */
class WarehouseAccessService {
  /**
   * Generate a one-time access link with Digital Signature
   */
  static async generateOneTimeLink(smartInventoryId, sellerId, contactEmail) {
    // 1. OWNERSHIP VERIFICATION (Sovereign Primary Rule)
    const inventory = await SmartInventory.findOne({
      where: { id: smartInventoryId, sellerId: sellerId },
    });
    if (!inventory)
      throw new AppError("UNAUTHORIZED_ACCESS: Ownership check failed.", 403);

    // 2. DIGITAL SIGNATURE (HMAC-SHA256)
    const timestamp = Date.now();
    const dataToSign = `${sellerId}:${smartInventoryId}:${timestamp}`;
    const signature = crypto
      .createHmac(
        "sha256",
        process.env.LINK_SIGNING_KEY || "SOVEREIGN_MASTER_SIGN_KEY",
      )
      .update(dataToSign)
      .digest("hex");

    // 3. SECURE TOKEN GENERATION
    // We pack the signature and timestamp into the token and encrypt it
    const tokenPayload = `${signature}:${timestamp}:${smartInventoryId}`;
    const secureToken = encrypt(tokenPayload);

    // 4. Persistence for Invalidation
    await inventory.update({
      oneTimeAccessToken: signature, // Store signature as token for first-visit validation
      tokenExpiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24H
    });

    const baseUrl = process.env.BASE_URL || "http://localhost:3000";
    return {
      accessLink: `${baseUrl}/api/warehouse/access/${encodeURIComponent(secureToken)}`,
      expiresAt: inventory.tokenExpiresAt,
    };
  }

  /**
   * Validate Access Link (First usage only)
   */
  static async validateAccess(encryptedToken) {
    const payload = decrypt(encryptedToken);
    if (!payload || !payload.includes(":"))
      throw new AppError("INVALID_TOKEN", 401);

    const [signature, timestamp, inventoryId] = payload.split(":");

    // 1. Expiry Check
    if (Date.now() - parseInt(timestamp) > 24 * 60 * 60 * 1000) {
      throw new AppError("TOKEN_EXPIRED", 401);
    }

    // 2. Fetch Inventory & Verify Token Haven't Been Used
    const inventory = await SmartInventory.findByPk(inventoryId, {
      include: [{ model: Product, as: "product" }],
    });

    if (!inventory || inventory.oneTimeAccessToken !== signature) {
      throw new AppError("TOKEN_ALREADY_USED_OR_INVALID", 401);
    }

    // 3. Invalidate on first read (Sovereign Policy)
    await inventory.update({ oneTimeAccessToken: null });

    return inventory;
  }
}

module.exports = WarehouseAccessService;
