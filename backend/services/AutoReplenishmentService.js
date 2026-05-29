const {
  SmartInventory,
  Product,
  AutoReplenishmentOrder,
  PriceQuote,
  Sequelize,
} = require("../sequelize_setup");
const { Op } = Sequelize;
const SupplierQualificationService = require("./SupplierQualificationService");
const AutoNegotiationService = require("./AutoNegotiationService");

/**
 * 🔄 Sovereign Auto-Replenishment Orchestrator
 * Latency Requirement: < 200ms
 */
class AutoReplenishmentService {
  /**
   * Trigger replenishment check
   */
  static async checkAndReplenish(inventoryId) {
    const startTime = Date.now();

    // 1. Fetch Inventory Context
    const inventory = await SmartInventory.findByPk(inventoryId, {
      include: [{ model: Product, as: "product" }],
    });

    if (!inventory || !inventory.product) return;

    // 🛡️ Sovereign Security Gate: Check if feature is enabled
    if (!inventory.autoReplenishEnabled) {
      console.log(
        `🛡️ SARS: Auto-replenish skipped for inventory ${inventoryId} (Disabled by policy).`,
      );
      return;
    }

    // 2. Determine Historical Avg Price (Simulated or from quotes)
    // For Phase 3, we look at last accepted quotes for this product category
    const lastQuotes = await PriceQuote.findAll({
      where: { status: "accepted" },
      limit: 10,
    });

    let avgPrice = 100; // Default fallback
    if (lastQuotes.length > 0) {
      const sum = lastQuotes.reduce(
        (acc, q) => acc + (parseFloat(q.fixedPrice) || 0),
        0,
      );
      avgPrice = sum / lastQuotes.length;
    }

    // 3. Find 3 Qualified Suppliers (O(1) search)
    const suppliers = await SupplierQualificationService.getQualifiedSuppliers(
      inventory.product.categoryId,
      avgPrice,
    );

    if (suppliers.length === 0) {
      console.log("🚫 No qualified suppliers found for SARS.");
      return;
    }

    // 4. Initiate Order
    const order = await AutoReplenishmentOrder.create({
      inventoryId: inventory.id,
      productId: inventory.productId,
      encryptedTargetPrice: avgPrice,
      status: "evaluating",
    });

    // 5. Start Negotiation with top 3
    for (const supplier of suppliers) {
      await AutoNegotiationService.initiateNegotiation(
        order.id,
        supplier.id,
        avgPrice,
      );
    }

    console.log(
      `🚀 SARS: Replenishment order ${order.id} initiated in ${Date.now() - startTime}ms`,
    );
  }
}

module.exports = AutoReplenishmentService;
