const crypto = require("crypto");
const fs = require("fs");
const path = require("path");

class CodeSigningSystem {
  constructor() {
    this.privateKey = process.env.CODE_SIGNING_PRIVATE_KEY;
    this.publicKey = process.env.CODE_SIGNING_PUBLIC_KEY;
  }

  signCommit(files) {
    const commitHash = this.generateCommitHash(files);
    const signature = this.createSignature(commitHash);

    return {
      commitHash,
      signature,
      timestamp: new Date().toISOString(),
      files: files.map((f) => ({
        path: f,
        hash: this.hashFile(f),
      })),
    };
  }

  verifySignature(signatureData) {
    const calculatedHash = this.generateCommitHash(
      signatureData.files.map((f) => f.path),
    );

    const verifier = crypto.createVerify("SHA256");
    verifier.update(calculatedHash);

    const isValid = verifier.verify(
      this.publicKey,
      signatureData.signature,
      "base64",
    );

    if (!isValid) {
      throw new Error("❌ توقيع الكود غير صالح - رفض الدمج");
    }

    return true;
  }

  hashFile(filePath) {
    const content = fs.readFileSync(filePath, "utf8");
    return crypto.createHash("sha256").update(content).digest("hex");
  }

  generateCommitHash(files) {
    const hashes = files.map((f) => this.hashFile(f)).join("");
    return crypto.createHash("sha256").update(hashes).digest("hex");
  }

  createSignature(data) {
    const signer = crypto.createSign("SHA256");
    signer.update(data);
    signer.end();
    return signer.sign(this.privateKey, "base64");
  }
}

module.exports = new CodeSigningSystem();
