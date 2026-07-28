const crypto = require("crypto");
const { AuditLog } = require("../sequelize_setup");

/**
 * External Sales AI Verification Service
 * Processes offline invoices/documents, detects fraud/duplicates, feeds price intelligence,
 * and updates merchant commercial portfolio without manual data entry.
 */
class ExternalSalesVerificationService {
  constructor() {
    this.processedHashes = new Set();
  }

  /**
   * Generates SHA-256 hash for document content to prevent duplicate invoice uploads
   */
  generateDocumentHash(content) {
    return crypto.createHash("sha256").update(content || "").digest("hex");
  }

  /**
   * AI Verification Pipeline for Offline Invoices
   * 
   * @param {string} sellerOrganizationId 
   * @param {Object} rawDocumentPayload 
   * @param {string} rawDocumentPayload.content - Raw invoice text/image buffer
   * @param {string} rawDocumentPayload.invoiceNumber - Invoice number
   * @param {number} rawDocumentPayload.amountSAR - Total amount SAR
   * @param {string} rawDocumentPayload.issueDate - Issue date (ISO)
   */
  async processOfflineSalesVerification(sellerOrganizationId, rawDocumentPayload) {
    const { content, invoiceNumber, amountSAR, issueDate } = rawDocumentPayload;

    // 1. OCR Extraction (Simulated NLP Document Parser)
    const extractedData = {
      productName: "حديد تسليح 12 مم",
      category: "مواد البناء",
      quantity: 150,
      unitPriceSAR: 4200,
      totalAmountSAR: amountSAR || 630000,
      buyerName: "شركة مقاولات كبرى (مخفي)",
      issueDate: issueDate || new Date().toISOString()
    };

    // 2. Anti-Fraud & Duplicate Hash Check
    const docHash = this.generateDocumentHash(content || `${invoiceNumber}-${amountSAR}-${issueDate}`);
    if (this.processedHashes.has(docHash)) {
      return {
        success: false,
        status: "REJECTED_DUPLICATE",
        reason: "Anti-Fraud Violation: Duplicate invoice hash detected. Invoice already verified."
      };
    }

    // 3. Date Staleness Check (Invoices older than 365 days rejected)
    const ageDays = (new Date() - new Date(extractedData.issueDate)) / (1000 * 3600 * 24);
    if (ageDays > 365) {
      return {
        success: false,
        status: "REJECTED_STALE_DATE",
        reason: "Verification Failed: Invoice date is older than 1 year."
      };
    }

    // Save Hash to memory
    this.processedHashes.add(docHash);

    // 4. Price Intelligence Feed (Learns market price trend)
    const priceIntelligenceFeed = {
      productName: extractedData.productName,
      learnedMarketPriceSAR: extractedData.unitPriceSAR,
      volumeUnits: extractedData.quantity,
      learnedAt: new Date().toISOString()
    };

    // 5. Log Verification in Audit Trail
    await AuditLog.create({
      action: "EXTERNAL_SALE_VERIFIED",
      aggregateType: "Organization",
      aggregateId: sellerOrganizationId,
      actorId: sellerOrganizationId,
      payload: { extractedData, priceIntelligenceFeed }
    }).catch(() => {});

    return {
      success: true,
      status: "VERIFIED",
      sellerOrganizationId,
      docHash,
      extractedData,
      priceIntelligenceFeed,
      portfolioIncrementSAR: extractedData.totalAmountSAR,
      badgeProgress: "VERIFIED_MERCHANT_PROGRESS"
    };
  }
}

const externalSalesVerificationService = new ExternalSalesVerificationService();

module.exports = {
  ExternalSalesVerificationService,
  externalSalesVerificationService
};
