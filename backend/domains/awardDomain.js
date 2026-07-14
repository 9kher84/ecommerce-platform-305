class AwardDomain {

  // Validates an incoming award mapping: { "prItemId": "quoteItemId" }
  static validateAwardSelection(rfq, quotations, awardSelections, buyerId) {
    const errors = [];
    const validLines = [];

    // 1. Authorization
    if (rfq.userId !== buyerId) {
      errors.push("Unauthorized: Only the buyer can award this request.");
    }

    // 2. RFQ State check
    if (rfq.status === "awarded" || rfq.status === "cancelled" || rfq.status === "closed") {
      errors.push(`Cannot award: RFQ is in '${rfq.status}' state.`);
    }

    // 3. Map out valid quotation items
    const quoteItemMap = new Map();
    quotations.forEach(quote => {
      if (quote.status !== "submitted") return; // Only submitted quotes are awardable (not superseded, withdrawn, rejected)
      (quote.items || []).forEach(qi => {
        // Build snapshot directly from the quote's current state
        quoteItemMap.set(qi.id, {
          quoteId: quote.id,
          sellerOrganizationId: quote.sellerOrganizationId,
          quoteItem: qi,
          parentQuote: quote
        });
      });
    });

    const rfqItemMap = new Map();
    (rfq.items || []).forEach(ri => rfqItemMap.set(ri.id, ri));

    // 4. Validate Selections
    for (const [prItemId, quoteItemId] of Object.entries(awardSelections)) {
      const rfqItem = rfqItemMap.get(prItemId);
      if (!rfqItem) {
        errors.push(`PurchaseRequestItem ${prItemId} does not belong to this RFQ.`);
        continue;
      }

      if (rfqItem.status === "awarded") {
        errors.push(`Item ${prItemId} is already awarded.`);
        continue;
      }

      const quoteData = quoteItemMap.get(quoteItemId);
      if (!quoteData) {
        errors.push(`QuotationItem ${quoteItemId} is invalid or belongs to a non-active quotation.`);
        continue;
      }

      if (quoteData.quoteItem.purchaseRequestItemId !== prItemId) {
        errors.push(`Mismatch: QuotationItem ${quoteItemId} does not belong to PRItem ${prItemId}.`);
        continue;
      }

      // Valid line for Award
      validLines.push({
        purchaseRequestItemId: prItemId,
        quotationItemId: quoteItemId,
        sellerOrganizationId: quoteData.sellerOrganizationId,
        productDNAId: quoteData.quoteItem.productDNAId,
        quantityAwarded: quoteData.quoteItem.quantityOffered,
        unitPriceAwarded: quoteData.quoteItem.unitPrice,
        currency: quoteData.quoteItem.currency,
        taxRate: quoteData.quoteItem.taxRate,
        discount: quoteData.quoteItem.discount,
        leadTime: quoteData.quoteItem.leadTime,
        notes: quoteData.quoteItem.notes,
        // Full Snapshot requested by User (Point 1 & 7)
        // Discarding unnecessary nesting and capturing the pricing context.
        snapshot: {
          quoteId: quoteData.quoteId,
          quoteSubtotal: quoteData.parentQuote.subtotal,
          quoteTaxAmount: quoteData.parentQuote.taxAmount,
          quoteDiscountAmount: quoteData.parentQuote.discountAmount,
          quoteGrandTotal: quoteData.parentQuote.grandTotal,
          paymentTerms: quoteData.parentQuote.paymentTerms,
          requestedDescription: quoteData.quoteItem.requestedDescription,
          requestedQuantity: quoteData.quoteItem.requestedQuantity,
          requestedUnit: quoteData.quoteItem.requestedUnit,
        }
      });
    }

    if (Object.keys(awardSelections).length === 0) {
      errors.push("No items selected for award.");
    }

    return {
      isValid: errors.length === 0,
      errors,
      validLines
    };
  }

  static deriveRfqStatus(rfqItems, newAwardedItemIds) {
    let awardedCount = 0;
    
    rfqItems.forEach(item => {
      if (item.status === "awarded" || newAwardedItemIds.includes(item.id)) {
        awardedCount++;
      }
    });

    if (awardedCount === 0) return "quoting";
    if (awardedCount === rfqItems.length) return "awarded";
    return "partially_awarded";
  }

}

module.exports = AwardDomain;
