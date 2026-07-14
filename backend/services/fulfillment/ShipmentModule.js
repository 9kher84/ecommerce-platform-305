const { Shipment, ShipmentLine } = require("../../sequelize_setup");
const StateProjectionModule = require("./StateProjectionModule");
const { emitOperationalEvent } = require("../../utils/EventBus");

class ShipmentModule {
  static async createShipment(poId, sellerOrganizationId, sellerUserId, shipmentData, transaction) {
    const shipment = await Shipment.create({
      purchaseOrderId: poId,
      sellerOrganizationId,
      trackingNumber: shipmentData.trackingNumber || null,
      carrier: shipmentData.carrier || null,
      status: "preparing"
    }, { transaction });

    for (const line of shipmentData.lines) {
      await ShipmentLine.create({
        shipmentId: shipment.id,
        purchaseOrderLineId: line.purchaseOrderLineId,
        quantityPacked: line.quantityPacked || 0,
        quantityLoaded: line.quantityLoaded || 0,
        quantityShipped: line.quantityShipped || 0
      }, { transaction });
    }

    emitOperationalEvent("SHIPMENT_CREATED", "Shipment", shipment.id, "seller", sellerUserId, { purchaseOrderId: poId, shipmentId: shipment.id });

    return shipment;
  }

  static async dispatchShipment(shipmentId, sellerUserId, transaction) {
    const shipment = await Shipment.findByPk(shipmentId, { transaction });
    if (!shipment) throw new Error("Shipment not found");

    await shipment.update({ status: "in_transit", shippedAt: new Date() }, { transaction });

    emitOperationalEvent("SHIPMENT_DISPATCHED", "Shipment", shipment.id, "seller", sellerUserId, { purchaseOrderId: shipment.purchaseOrderId, shipmentId: shipment.id });

    // Project State Upward
    await StateProjectionModule.projectPOState(shipment.purchaseOrderId, transaction);

    return shipment;
  }
}

module.exports = ShipmentModule;
