const { PurchaseOrder } = require("../../sequelize_setup");
const { emitOperationalEvent } = require("../../utils/EventBus");

class PreparationModule {
  static async startPreparation(poId, sellerUserId, transaction, options = {}) {
    const po = await PurchaseOrder.findByPk(poId, { transaction });
    if (!po) throw { statusCode: 404, message: "Purchase Order not found" };

    if (po.businessStatus !== "accepted") {
      throw { statusCode: 400, message: `Cannot start preparation for Purchase Order in '${po.businessStatus}' status. Must be accepted.` };
    }

    if (po.fulfillmentStatus !== "pending") {
      throw { statusCode: 400, message: `Cannot start preparation from status: ${po.fulfillmentStatus}` };
    }

    await po.update({ fulfillmentStatus: "preparing" }, { transaction });

    const emitFn = () => emitOperationalEvent("PO_PREPARATION_STARTED", "PurchaseOrder", po.id, "seller", sellerUserId, { purchaseOrderNumber: po.purchaseOrderNumber });
    if (options.deferEvents && Array.isArray(options.pendingEvents)) {
      options.pendingEvents.push(emitFn);
    } else {
      emitFn();
    }

    return po;
  }

  static async markReadyToShip(poId, sellerUserId, transaction, options = {}) {
    const po = await PurchaseOrder.findByPk(poId, { transaction });
    if (!po) throw { statusCode: 404, message: "Purchase Order not found" };

    if (po.businessStatus !== "accepted") {
      throw { statusCode: 400, message: `Cannot mark ready to ship for Purchase Order in '${po.businessStatus}' status. Must be accepted.` };
    }

    if (po.fulfillmentStatus !== "preparing") {
      throw { statusCode: 400, message: `Cannot mark ready to ship from status: ${po.fulfillmentStatus}` };
    }

    await po.update({ fulfillmentStatus: "ready_to_ship" }, { transaction });

    const emitFn = () => emitOperationalEvent("PO_READY_TO_SHIP", "PurchaseOrder", po.id, "seller", sellerUserId, { purchaseOrderNumber: po.purchaseOrderNumber });
    if (options.deferEvents && Array.isArray(options.pendingEvents)) {
      options.pendingEvents.push(emitFn);
    } else {
      emitFn();
    }

    return po;
  }
}

module.exports = PreparationModule;
