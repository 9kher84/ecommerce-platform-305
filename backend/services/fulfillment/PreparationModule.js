const { PurchaseOrder } = require("../../sequelize_setup");
const { emitOperationalEvent } = require("../../utils/EventBus");

class PreparationModule {
  static async startPreparation(poId, sellerUserId, transaction) {
    const po = await PurchaseOrder.findByPk(poId, { transaction });
    if (!po) throw new Error("Purchase Order not found");

    if (po.fulfillmentStatus !== "pending") {
      throw new Error(`Cannot start preparation from status: ${po.fulfillmentStatus}`);
    }

    await po.update({ fulfillmentStatus: "preparing" }, { transaction });

    emitOperationalEvent("PO_PREPARATION_STARTED", "PurchaseOrder", po.id, "seller", sellerUserId, { purchaseOrderNumber: po.purchaseOrderNumber });

    return po;
  }

  static async markReadyToShip(poId, sellerUserId, transaction) {
    const po = await PurchaseOrder.findByPk(poId, { transaction });
    if (!po) throw new Error("Purchase Order not found");

    if (po.fulfillmentStatus !== "preparing") {
      throw new Error(`Cannot mark ready to ship from status: ${po.fulfillmentStatus}`);
    }

    await po.update({ fulfillmentStatus: "ready_to_ship" }, { transaction });

    emitOperationalEvent("PO_READY_TO_SHIP", "PurchaseOrder", po.id, "seller", sellerUserId, { purchaseOrderNumber: po.purchaseOrderNumber });

    return po;
  }
}

module.exports = PreparationModule;
