const { Product, SmartInventory, sequelize } = require("../sequelize_setup");

class InventoryEngine {
  /**
   * @desc Analyze Inventory Pressure (Plan B)
   */
  static async analyzeInventoryPressure(sellerId) {
    const products = await Product.findAll({
      where: { sellerId },
      include: [{ model: SmartInventory, as: "smartInventory" }],
    });

    return products
      .map((p) => {
        const daysInStock = p.createdAt
          ? Math.floor(
              (new Date() - new Date(p.createdAt)) / (1000 * 60 * 60 * 24),
            )
          : 0;
        const pressure =
          daysInStock > 90 || p.stockLevel > 500 ? "High" : "Normal";

        return {
          productId: p.id,
          name: p.name,
          stockLevel: p.stockLevel,
          daysInStock,
          pressure,
        };
      })
      .filter((item) => item.pressure === "High");
  }

  /**
   * @desc Generate Loss Sale Recommendations (Inventory clearing)
   */
  static async generateLossSaleRecommendations(sellerId) {
    const pressuredItems = await this.analyzeInventoryPressure(sellerId);

    return pressuredItems.map((item) => ({
      productId: item.productId,
      name: item.name,
      reason:
        item.daysInStock > 90
          ? "ركود المخزون لأكثر من 90 يوم"
          : "تضخم المخزون بشكل كبير",
      suggestedDiscount: "10% - 20%",
      instruction: "بيع سريع لتفريغ مساحة المستودع وتقليل تكاليف التخزين",
    }));
  }

  /**
   * @desc Generate Transfer Recommendations (Plan B)
   */
  static async generateTransferRecommendations(sellerId) {
    // Mocked logic for multi-warehouse balance
    return [
      {
        productId: "SAMPLE-ID",
        from: "مستودع الرياض",
        to: "مستودع الدمام",
        quantity: 50,
        reason: "ارتفاع الطلب في المنقطة الشرقية بنسبة 25% في قطاعك",
      },
    ];
  }
}

module.exports = InventoryEngine;
