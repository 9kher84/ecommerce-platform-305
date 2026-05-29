const crypto = require("crypto");
const logger = require("../config/logger");
const fs = require("fs");

class MultiSigGovernance {
  constructor() {
    // In prod, load these from secure storage/Vault
    this.signers = {
      "compliance-officer": process.env.SIG_KEY_COMPLIANCE,
      "system-admin": process.env.SIG_KEY_ADMIN,
    };
    this.actionLogPath = "secure_audit/multisig_log.json";
  }

  verifyExecution(payload, signatures) {
    if (!Array.isArray(signatures) || signatures.length < 2) {
      throw new Error("❌ مطلوب توقيعين على الأقل لتنفيذ هذا الإجراء");
    }

    const verifiedSigners = new Set();

    signatures.forEach((sigObj) => {
      const { signerId, signature } = sigObj;
      const publicKey = this.signers[signerId];

      if (!publicKey) {
        throw new Error(`❌ الموقع ${signerId} غير معروف`);
      }

      const verifier = crypto.createVerify("SHA256");
      verifier.update(JSON.stringify(payload));

      if (verifier.verify(publicKey, signature, "base64")) {
        verifiedSigners.add(signerId);
      } else {
        throw new Error(`❌ توقيع غير صالح للموقع ${signerId}`);
      }
    });

    if (verifiedSigners.size < 2) {
      throw new Error("❌ فشل التحقق من التوقيع المزدوج");
    }

    this.logAction(payload, Array.from(verifiedSigners));
    return true;
  }

  logAction(payload, signers) {
    const entry = {
      timestamp: new Date().toISOString(),
      action: payload.action,
      payload_hash: crypto
        .createHash("sha256")
        .update(JSON.stringify(payload))
        .digest("hex"),
      signers: signers,
    };

    // Append to immutable log (simulation via file append)
    // In prod, this would go to a blockchain or WORM storage
    // using console for now as file system append might strictly need check
    logger.info(`✅ Multi-Sig Execution Approved: ${JSON.stringify(entry)}`);
  }
}

module.exports = new MultiSigGovernance();
