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

  /**
   * Pure read-only summary for Receipt / Goods Inspection Execution.
   * Computes line-by-line ordered, shipped, received, accepted, damaged, rejected,
   * remainingToReceive, and remainingToAccept quantities for a Purchase Order.
   */
  static async getPOReceiptSummary(poId, transaction) {
    const po = await PurchaseOrder.findByPk(poId, {
      include: [{ model: PurchaseOrderLine, as: "lines" }],
      transaction
    });

    if (!po) throw { statusCode: 404, message: "Purchase Order not found for receipt summary" };

    const shipments = await Shipment.findAll({
      where: { purchaseOrderId: poId },
      include: [{ model: ShipmentLine, as: "lines" }],
      transaction
    });

    const receipts = await Receipt.findAll({
      where: { purchaseOrderId: poId },
      include: [{ model: ReceiptLine, as: "lines" }],
      transaction
    });

    // Map shipped quantities per purchaseOrderLineId across dispatched shipments
    const shippedByLine = {};
    shipments.forEach(s => {
      if (s.status !== "preparing" && s.lines && Array.isArray(s.lines)) {
        s.lines.forEach(sl => {
          const lineId = sl.purchaseOrderLineId;
          const qty = parseFloat(sl.quantityShipped) || 0;
          shippedByLine[lineId] = (shippedByLine[lineId] || 0) + qty;
        });
      }
    });

    // Map physical receipt quantities per purchaseOrderLineId across all receipts
    const receivedByLine = {};
    const acceptedByLine = {};
    const damagedByLine = {};
    const rejectedByLine = {};

    receipts.forEach(r => {
      if (r.lines && Array.isArray(r.lines)) {
        r.lines.forEach(rl => {
          const lineId = rl.purchaseOrderLineId;
          const acc = parseFloat(rl.acceptedQuantity) || 0;
          const dam = parseFloat(rl.damagedQuantity) || 0;
          const rej = parseFloat(rl.rejectedQuantity) || 0;
          const tot = acc + dam + rej;

          receivedByLine[lineId] = (receivedByLine[lineId] || 0) + tot;
          damagedByLine[lineId] = (damagedByLine[lineId] || 0) + dam;
          rejectedByLine[lineId] = (rejectedByLine[lineId] || 0) + rej;

          // acceptedQuantity only counts when receipt is accepted or lines accepted
          if (r.status === "accepted") {
            acceptedByLine[lineId] = (acceptedByLine[lineId] || 0) + acc;
          }
        });
      }
    });

    const linesSummary = po.lines.map(line => {
      const ordered = parseFloat(line.quantity) || 0;
      const shipped = shippedByLine[line.id] || 0;
      const received = receivedByLine[line.id] || 0;
      const accepted = acceptedByLine[line.id] || 0;
      const damaged = damagedByLine[line.id] || 0;
      const rejected = rejectedByLine[line.id] || 0;

      const remainingToReceive = Math.max(0, shipped - received);
      const remainingToAccept = Math.max(0, ordered - accepted);

      return {
        purchaseOrderLineId: line.id,
        productDNAId: line.productDNAId || null,
        unitPrice: line.unitPrice,
        orderedQuantity: ordered,
        shippedQuantity: shipped,
        receivedQuantity: received,
        acceptedQuantity: accepted,
        damagedQuantity: damaged,
        rejectedQuantity: rejected,
        remainingToReceiveQuantity: remainingToReceive,
        remainingToAcceptQuantity: remainingToAccept
      };
    });

    const receiptSummaries = receipts.map(r => ({
      receiptId: r.id,
      shipmentId: r.shipmentId,
      status: r.status,
      receivedAt: r.receivedAt
    }));

    return {
      purchaseOrderId: po.id,
      purchaseOrderNumber: po.purchaseOrderNumber,
      buyerId: po.buyerId,
      businessStatus: po.businessStatus,
      fulfillmentStatus: po.fulfillmentStatus,
      lines: linesSummary,
      receipts: receiptSummaries
    };
  }
}

module.exports = StateProjectionModule;
