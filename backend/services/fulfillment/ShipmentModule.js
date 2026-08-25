const { Shipment, ShipmentLine, PurchaseOrder } = require("../../sequelize_setup");
const StateProjectionModule = require("./StateProjectionModule");
const { emitOperationalEvent } = require("../../utils/EventBus");

class ShipmentModule {
  static async createShipment(poId, sellerOrganizationId, sellerUserId, shipmentData, transaction, options = {}) {
    const po = await PurchaseOrder.findByPk(poId, { transaction });
    if (!po) throw { statusCode: 404, message: "Purchase Order not found" };

    if (po.businessStatus !== "accepted") {
      throw { statusCode: 400, message: `Cannot create shipment for Purchase Order in '${po.businessStatus}' status. Must be accepted.` };
    }

    const validFulfillmentStates = ["ready_to_ship", "partially_shipped"];
    if (!validFulfillmentStates.includes(po.fulfillmentStatus)) {
      throw {
        statusCode: 400,
        message: `Cannot create shipment for Purchase Order in '${po.fulfillmentStatus}' fulfillment status. Must be 'ready_to_ship' or 'partially_shipped'.`
      };
    }

    const shipment = await Shipment.create({
      purchaseOrderId: poId,
      sellerOrganizationId,
      trackingNumber: shipmentData.trackingNumber || null,
      carrier: shipmentData.carrier || null,
      status: "preparing"
    }, { transaction });

    if (shipmentData.lines && Array.isArray(shipmentData.lines)) {
      for (const line of shipmentData.lines) {
        await ShipmentLine.create({
          shipmentId: shipment.id,
          purchaseOrderLineId: line.purchaseOrderLineId,
          quantityPacked: line.quantityPacked || 0,
          quantityLoaded: line.quantityLoaded || 0,
          quantityShipped: line.quantityShipped || 0
        }, { transaction });
      }
    }

    const emitFn = () => emitOperationalEvent("SHIPMENT_CREATED", "Shipment", shipment.id, "seller", sellerUserId, { purchaseOrderId: poId, shipmentId: shipment.id });
    if (options.deferEvents && Array.isArray(options.pendingEvents)) {
      options.pendingEvents.push(emitFn);
    } else {
      emitFn();
    }

    return shipment;
  }

  static async dispatchShipment(shipmentId, sellerUserId, transaction, options = {}) {
    const shipment = await Shipment.findByPk(shipmentId, { transaction });
    if (!shipment) throw { statusCode: 404, message: "Shipment not found" };

    const po = await PurchaseOrder.findByPk(shipment.purchaseOrderId, { transaction });
    if (po && po.businessStatus !== "accepted") {
      throw { statusCode: 400, message: `Cannot dispatch shipment for Purchase Order in '${po.businessStatus}' status. Must be accepted.` };
    }

    await shipment.update({ status: "in_transit", shippedAt: new Date() }, { transaction });

    const emitFn = () => emitOperationalEvent("SHIPMENT_DISPATCHED", "Shipment", shipment.id, "seller", sellerUserId, { purchaseOrderId: shipment.purchaseOrderId, shipmentId: shipment.id });
    if (options.deferEvents && Array.isArray(options.pendingEvents)) {
      options.pendingEvents.push(emitFn);
    } else {
      emitFn();
    }

    // Project State Upward
    await StateProjectionModule.projectPOState(shipment.purchaseOrderId, transaction);

    return shipment;
  }
}

module.exports = ShipmentModule;
