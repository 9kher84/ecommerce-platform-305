/**
 * Commercial KPIs Engine
 * Aggregates role-tailored commercial KPIs for Sellers, Buyers, and Admin Operations.
 */
class CommercialKpisEngine {
  /**
   * Generates role-tailored KPIs
   * 
   * @param {string} role - 'SELLER' | 'BUYER' | 'ADMIN'
   * @param {string} entityId 
   */
  static getRoleKpis(role, entityId) {
    const roleKey = role.toUpperCase();

    if (roleKey === "SELLER") {
      return {
        role: "SELLER",
        entityId,
        kpis: {
          totalSalesSAR: 38000000,
          winRatePercent: 42.5,
          avgResponseMinutes: 18,
          activeContractsCount: 24,
          recurringBuyersCount: 18,
          cancellationRatePercent: 0.8,
          commissionClearanceStatus: "100% CLEAR"
        }
      };
    } else if (roleKey === "BUYER") {
      return {
        role: "BUYER",
        entityId,
        kpis: {
          totalSpendSAR: 14500000,
          costSavingsPercent: 11.4,
          fulfilledRfqsCount: 86,
          avgFulfillmentDays: 4.2,
          disputeRatePercent: 0.0
        }
      };
    }

    // Platform Admin Operations
    return {
      role: "ADMIN",
      entityId,
      kpis: {
        platformGmvSAR: 185000000,
        activeRfqsCount: 342,
        totalMerchantsCount: 1250,
        netPlatformCommissionSAR: 6290000,
        unpaidCommissionSuspensionsCount: 2
      }
    };
  }
}

module.exports = CommercialKpisEngine;
