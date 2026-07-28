/**
 * Fulfillment & Warranty Engine
 * Handles post-invoice fulfillment, delivery confirmation, warranty reviews, and return/refund triggers.
 */
class FulfillmentAndWarrantyEngine {
  static FULFILLMENT_STATES = {
    INVOICE_ACCEPTED: "INVOICE_ACCEPTED",
    PREPARING: "PREPARING",
    SHIPPED: "SHIPPED",
    DELIVERED: "DELIVERED",
    BUYER_CONFIRMED: "BUYER_CONFIRMED",
    WARRANTY_REVIEW: "WARRANTY_REVIEW",
    RETURN_REFUND_HANDLED: "RETURN_REFUND_HANDLED",
    CLOSED: "CLOSED"
  };

  /**
   * File a Warranty Claim if product arrives damaged/defective
   */
  static fileWarrantyClaim(dealId, buyerUserId, claimDetails = {}) {
    return {
      claimId: `war-${Date.now()}`,
      dealId,
      buyerUserId,
      claimType: claimDetails.type || "DAMAGED_ON_ARRIVAL", // 'DAMAGED_ON_ARRIVAL' | 'DEFECTIVE' | 'SPEC_MISMATCH'
      description: claimDetails.description || "Product defective upon receipt",
      status: "WARRANTY_REVIEW",
      createdAt: new Date().toISOString(),
      actionRequired: "DISPUTE_OFFICER_REVIEW"
    };
  }

  /**
   * Process Return/Refund Decision
   */
  static processReturnDecision(claimId, decision) {
    const isApproved = decision.toUpperCase() === "APPROVE";
    return {
      claimId,
      decision: isApproved ? "REFUND_APPROVED" : "REJECTED",
      status: isApproved ? "RETURN_REFUND_HANDLED" : "CLOSED",
      processedAt: new Date().toISOString(),
      message: isApproved ? "Warranty claim approved. Refund processed and returned to buyer." : "Warranty claim rejected."
    };
  }
}

module.exports = FulfillmentAndWarrantyEngine;
