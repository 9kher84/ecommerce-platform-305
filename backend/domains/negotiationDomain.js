class NegotiationDomain {
  
  static validateNegotiationRequest(rfq, quotation, buyerId) {
    const errors = [];

    // 1. Authorization
    if (rfq.userId !== buyerId) {
      errors.push("Unauthorized: Only the buyer can initiate a negotiation.");
    }

    // 2. RFQ State check
    if (rfq.status === "awarded" || rfq.status === "cancelled" || rfq.status === "closed") {
      errors.push(`Cannot negotiate because RFQ is in '${rfq.status}' state.`);
    }

    // 3. Quote State check
    if (quotation.status !== "submitted") {
      errors.push(`Cannot negotiate quotation in '${quotation.status}' state. Only 'submitted' quotes can be negotiated.`);
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }

}

module.exports = NegotiationDomain;
