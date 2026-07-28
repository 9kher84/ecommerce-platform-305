class QuotationItem {
  constructor(data) {
    this.id = data.id;
    this.purchaseRequestItemId = data.purchaseRequestItemId;
    this.productDNAId = data.productDNAId || null;
    this.requestedDescription = data.requestedDescription;
    this.requestedQuantity = data.requestedQuantity;
    this.requestedUnit = data.requestedUnit;
    
    this.unitPrice = parseFloat(data.unitPrice) || 0;
    this.quantityOffered = parseFloat(data.quantityOffered) || 0;
    this.currency = data.currency || "SAR";
    this.taxRate = parseFloat(data.taxRate) || 15.0;
    this.discount = parseFloat(data.discount) || 0;
    
    this.leadTime = data.leadTime || null;
    this.notes = data.notes || null;

    // Derived values
    this.calculateSubtotals();
  }

  calculateSubtotals() {
    this.itemSubtotal = this.unitPrice * this.quantityOffered;
    this.itemAfterDiscount = Math.max(0, this.itemSubtotal - this.discount);
    this.itemTax = this.itemAfterDiscount * (this.taxRate / 100);
  }
}

module.exports = QuotationItem;
