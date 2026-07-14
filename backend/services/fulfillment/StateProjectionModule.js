const { PurchaseOrder, PurchaseOrderLine, Shipment, ShipmentLine, Receipt, ReceiptLine } = require("../../sequelize_setup");

class StateProjectionModule {
  /**
   * Projects the fulfillment status of a Purchase Order based on the physical realities of Shipments and Receipts.
   * This is the single source of truth for PO fulfillmentStatus transitions.
   */
  static async projectPOState(poId, transaction) {
    const po = await PurchaseOrder.findByPk(poId, {
      include: [
        { model: PurchaseOrderLine, as: "lines" }
      ],
      transaction
    });

    if (!po) throw new Error("PO not found for state projection");

    // Total PO quantity requested
    const totalOrderedQuantity = po.lines.reduce((sum, line) => sum + parseFloat(line.quantity), 0);

    // Fetch all Shipments
    const shipments = await Shipment.findAll({
      where: { purchaseOrderId: poId },
      include: [{ model: ShipmentLine, as: "lines" }],
      transaction
    });

    // Fetch all Receipts
    const receipts = await Receipt.findAll({
      where: { purchaseOrderId: poId },
      include: [{ model: ReceiptLine, as: "lines" }],
      transaction
    });

    let totalShipped = 0;
    shipments.forEach(s => {
      s.lines.forEach(sl => {
        totalShipped += parseFloat(sl.quantityShipped);
      });
    });

    let totalReceived = 0;
    receipts.forEach(r => {
      r.lines.forEach(rl => {
        // According to user, Receipt is the operational truth.
        // We look at accepted + damaged + rejected to understand how much was physically received.
        // However, for PO closure, we typically care about what was accepted, but for now, totalReceived implies goods arrived.
        totalReceived += parseFloat(rl.acceptedQuantity) + parseFloat(rl.damagedQuantity) + parseFloat(rl.rejectedQuantity);
      });
    });

    // Evaluate State Logic (Bottom-Up)
    let projectedStatus = po.fulfillmentStatus;

    if (totalReceived > 0) {
      if (totalReceived >= totalOrderedQuantity) {
        projectedStatus = "received";
      } else {
        projectedStatus = "partially_received";
      }
    } else if (totalShipped > 0) {
      if (totalShipped >= totalOrderedQuantity) {
        projectedStatus = "shipped";
      } else {
        projectedStatus = "partially_shipped";
      }
    }

    // Only update if the projection dictates a change
    if (projectedStatus !== po.fulfillmentStatus) {
      await po.update({ fulfillmentStatus: projectedStatus }, { transaction });
    }

    return projectedStatus;
  }
}

module.exports = StateProjectionModule;
