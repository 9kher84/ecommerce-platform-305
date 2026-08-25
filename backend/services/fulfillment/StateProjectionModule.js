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

  /**
   * Pure read-only summary for Fulfillment Execution.
   * Computes ordered, shipped, and remaining quantities per PO line across all shipments.
   */
  static async getPOFulfillmentSummary(poId, transaction) {
    const po = await PurchaseOrder.findByPk(poId, {
      include: [{ model: PurchaseOrderLine, as: "lines" }],
      transaction
    });

    if (!po) throw { statusCode: 404, message: "Purchase Order not found for fulfillment summary" };

    const shipments = await Shipment.findAll({
      where: { purchaseOrderId: poId },
      include: [{ model: ShipmentLine, as: "lines" }],
      transaction
    });

    // Map shipped quantities per purchaseOrderLineId across dispatched shipments
    const shippedByLine = {};
    shipments.forEach(s => {
      // Only count shipments that have officially been dispatched (in_transit, delivered)
      if (s.status !== "preparing" && s.lines && Array.isArray(s.lines)) {
        s.lines.forEach(sl => {
          const lineId = sl.purchaseOrderLineId;
          const qty = parseFloat(sl.quantityShipped) || 0;
          shippedByLine[lineId] = (shippedByLine[lineId] || 0) + qty;
        });
      }
    });

    const linesSummary = po.lines.map(line => {
      const ordered = parseFloat(line.quantity) || 0;
      const shipped = shippedByLine[line.id] || 0;
      const remaining = Math.max(0, ordered - shipped);
      return {
        purchaseOrderLineId: line.id,
        productDNAId: line.productDNAId || null,
        unitPrice: line.unitPrice,
        orderedQuantity: ordered,
        shippedQuantity: shipped,
        remainingQuantity: remaining
      };
    });

    return {
      purchaseOrderId: po.id,
      purchaseOrderNumber: po.purchaseOrderNumber,
      sellerOrganizationId: po.sellerOrganizationId,
      businessStatus: po.businessStatus,
      fulfillmentStatus: po.fulfillmentStatus,
      lines: linesSummary
    };
  }
}

module.exports = StateProjectionModule;
