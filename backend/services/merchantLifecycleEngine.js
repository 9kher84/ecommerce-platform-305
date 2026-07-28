/**
 * Merchant Lifecycle Engine
 * State machine managing progressive merchant growth stages from NEW to GLOBAL_SUPPLIER.
 */
class MerchantLifecycleEngine {
  static STAGES = {
    NEW: "NEW",
    VERIFIED: "VERIFIED",
    TRUSTED: "TRUSTED",
    GOLD: "GOLD",
    ENTERPRISE: "ENTERPRISE",
    STRATEGIC: "STRATEGIC",
    GOVERNMENT_SUPPLIER: "GOVERNMENT_SUPPLIER",
    GLOBAL_SUPPLIER: "GLOBAL_SUPPLIER"
  };

  /**
   * Resolves Merchant Stage based on completed deals and verified volume
   * 
   * @param {number} completedDealsCount 
   * @param {number} totalVolumeSAR 
   */
  static resolveMerchantStage(completedDealsCount, totalVolumeSAR) {
    if (totalVolumeSAR >= 50000000 && completedDealsCount >= 500) {
      return { stage: this.STAGES.GLOBAL_SUPPLIER, title: "Global Enterprise Supplier", badge: "GLOBAL_BADGE" };
    } else if (totalVolumeSAR >= 10000000 && completedDealsCount >= 100) {
      return { stage: this.STAGES.GOLD, title: "Gold Verified Supplier", badge: "GOLD_BADGE" };
    } else if (completedDealsCount >= 10) {
      return { stage: this.STAGES.VERIFIED, title: "Verified Merchant", badge: "VERIFIED_BADGE" };
    }
    
    return { stage: this.STAGES.NEW, title: "New Merchant", badge: "NEW_BADGE" };
  }
}

module.exports = MerchantLifecycleEngine;
