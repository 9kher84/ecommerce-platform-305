class QuotationDomain {
  
  // =========================
  // 1. STATE MACHINE
  // =========================
  static VALID_TRANSITIONS = {
    draft: ["submitted", "withdrawn"],
    submitted: ["withdrawn", "accepted", "rejected", "superseded", "expired"],
    accepted: [],
    rejected: [],
    withdrawn: ["submitted"],
    superseded: [],
    expired: []
  };

  static canTransition(currentStatus, newStatus) {
    if (!this.VALID_TRANSITIONS[currentStatus]) return false;
    return this.VALID_TRANSITIONS[currentStatus].includes(newStatus);
  }

  // =========================
  // 2. PRICING CALCULATIONS
  // =========================
  static calculateItemTotals(itemsData) {
    let subtotal = 0;
    let totalTax = 0;
    let totalDiscount = 0;

    const processedItems = itemsData.map(item => {
      const unitPrice = parseFloat(item.unitPrice) || 0;
      const qty = parseFloat(item.quantityOffered) || 0;
      const discount = parseFloat(item.discount) || 0;
      const taxRate = parseFloat(item.taxRate) || 15.0; // standard SA VAT

      const itemSubtotal = unitPrice * qty;
      const itemAfterDiscount = Math.max(0, itemSubtotal - discount);
      const itemTax = itemAfterDiscount * (taxRate / 100);
      
      subtotal += itemSubtotal;
      totalDiscount += discount;
      totalTax += itemTax;

      return {
        ...item,
        unitPrice,
        quantityOffered: qty,
        discount,
        taxRate
      };
    });

    const grandTotal = subtotal - totalDiscount + totalTax;

    return {
      processedItems,
      totals: {
        subtotal: parseFloat(subtotal.toFixed(2)),
        taxAmount: parseFloat(totalTax.toFixed(2)),
        discountAmount: parseFloat(totalDiscount.toFixed(2)),
        grandTotal: parseFloat(grandTotal.toFixed(2))
      }
    };
  }

  // =========================
  // 3. VALIDATIONS
  // =========================
  static validateSubmissionEligibility(rfq, sellerOrgId, existingQuotes) {
    const errors = [];

    // Check RFQ Status
    const allowedRfqStatuses = ["published", "rfq_published", "quoting"];
    if (!allowedRfqStatuses.includes(rfq.status)) {
      errors.push(`Cannot submit quote: RFQ is in '${rfq.status}' state.`);
    }

    // Check RFQ Expiry
    if (rfq.expiresAt && new Date(rfq.expiresAt) < new Date()) {
      errors.push("Cannot submit quote: RFQ has expired.");
    }

    // Check Duplicate Active Quotes
    const activeQuotes = existingQuotes.filter(q => q.status !== "withdrawn" && q.status !== "superseded" && q.status !== "rejected" && q.status !== "expired");
    if (activeQuotes.length > 0) {
      errors.push("Seller already has an active quotation for this RFQ.");
    }

    // Check Invitation for Secret Auctions
    if (rfq.auction_type === "secret") {
      const isInvited = (rfq.invitations || []).some(inv => inv.sellerOrganizationId === sellerOrgId);
      if (!isInvited) {
        errors.push("Cannot submit quote: You were not invited to this secret RFQ.");
      }
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  // =========================
  // 4. SNAPSHOT GENERATION
  // =========================
  static generateItemSnapshots(quoteItems, rfqItems) {
    const rfqItemMap = new Map();
    rfqItems.forEach(ri => rfqItemMap.set(ri.id, ri));

    return quoteItems.map(qi => {
      const rfqItem = rfqItemMap.get(qi.purchaseRequestItemId);
      if (!rfqItem) {
        throw new Error(`Invalid purchaseRequestItemId: ${qi.purchaseRequestItemId} not found on RFQ.`);
      }

      return {
        ...qi,
        productDNAId: qi.productDNAId || rfqItem.productDNAId || null,
        requestedDescription: rfqItem.freeTextDescription || "N/A",
        requestedQuantity: rfqItem.quantity,
        requestedUnit: rfqItem.unit
      };
    });
  }
}

module.exports = QuotationDomain;
