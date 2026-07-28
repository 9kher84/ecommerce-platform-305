class AwardLine {
  /**
   * @param {Object} data 
   * @param {string} data.id
   * @param {string} data.awardId
   * @param {string} data.purchaseRequestItemId
   * @param {string} data.quotationItemId
   * @param {string} data.sellerOrganizationId
   * @param {string} [data.productDNAId]
   * @param {number} data.quantityAwarded
   * @param {number} data.unitPriceAwarded
   * @param {string} [data.currency="SAR"]
   * @param {number} [data.taxRate=15]
   * @param {number} [data.discount=0]
   * @param {number} [data.leadTime]
   * @param {string} [data.notes]
   * @param {Object} data.snapshot
   */
  constructor(data) {
    this.id = data.id;
    this.awardId = data.awardId;
    this.purchaseRequestItemId = data.purchaseRequestItemId;
    this.quotationItemId = data.quotationItemId;
    this.sellerOrganizationId = data.sellerOrganizationId;
    this.productDNAId = data.productDNAId || null;
    this.quantityAwarded = parseFloat(data.quantityAwarded);
    this.unitPriceAwarded = parseFloat(data.unitPriceAwarded);
    this.currency = data.currency || "SAR";
    this.taxRate = parseFloat(data.taxRate || 15);
    this.discount = parseFloat(data.discount || 0);
    this.leadTime = data.leadTime || null;
    this.notes = data.notes || null;
    this.snapshot = data.snapshot;

    this.validate();
  }

  validate() {
    if (!this.purchaseRequestItemId) throw new Error("AwardLine requires a purchaseRequestItemId");
    if (!this.quotationItemId) throw new Error("AwardLine requires a quotationItemId");
    if (!this.sellerOrganizationId) throw new Error("AwardLine requires a sellerOrganizationId");
    if (this.quantityAwarded <= 0) throw new Error("AwardLine quantityAwarded must be greater than zero");
    if (this.unitPriceAwarded < 0) throw new Error("AwardLine unitPriceAwarded cannot be negative");
    if (!this.snapshot) throw new Error("AwardLine requires an immutable snapshot of the quotation");
  }

  getLineTotal() {
    const subtotal = this.quantityAwarded * this.unitPriceAwarded;
    const afterDiscount = Math.max(0, subtotal - this.discount);
    const taxAmount = afterDiscount * (this.taxRate / 100);
    return afterDiscount + taxAmount;
  }
}

module.exports = AwardLine;
