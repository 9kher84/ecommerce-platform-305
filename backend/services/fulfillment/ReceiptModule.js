const { Receipt, ReceiptLine, Shipment, ShipmentLine, PurchaseOrder, PurchaseOrderLine } = require("../../sequelize_setup");
const StateProjectionModule = require("./StateProjectionModule");
const InventoryProjectionModule = require("./InventoryProjectionModule");
const { emitOperationalEvent } = require("../../utils/EventBus");

class ReceiptModule {
  static async logReceipt(poId, buyerUserId, receiptData, transaction, options = {}) {
    const { deferEvents = false, pendingEvents = [] } = options;

    // Validate PO exists and is accepted
    const po = await PurchaseOrder.findByPk(poId, {
      include: [{ model: PurchaseOrderLine, as: "lines" }],
      transaction
    });

    if (!po) throw { statusCode: 404, message: "Purchase Order not found for receipt" };
    if (po.businessStatus !== "accepted") {
      throw { statusCode: 400, message: `Cannot log receipt for PO in '${po.businessStatus}' state. Must be accepted.` };
    }

    // Validate Shipment if shipmentId provided
    let shipment = null;
    let shipmentLines = [];
    let shipmentReceivedByLine = {};

    if (receiptData.shipmentId) {
      shipment = await Shipment.findByPk(receiptData.shipmentId, {
        include: [{ model: ShipmentLine, as: "lines" }],
        transaction
      });
      if (!shipment) throw { statusCode: 404, message: "Shipment not found for receipt" };
      if (shipment.purchaseOrderId !== poId) {
        throw { statusCode: 400, message: "Shipment does not belong to this Purchase Order" };
      }
      if (shipment.status === "preparing") {
        throw { statusCode: 400, message: "Cannot log receipt on a shipment that has not been dispatched." };
      }
      shipmentLines = shipment.lines || [];

      // Query receipts belonging strictly to THIS shipment for invariant B
      const existingShipmentReceipts = await Receipt.findAll({
        where: { shipmentId: receiptData.shipmentId },
        include: [{ model: ReceiptLine, as: "lines" }],
        transaction
      });

      existingShipmentReceipts.forEach(r => {
        if (r.lines && Array.isArray(r.lines)) {
          r.lines.forEach(rl => {
            const lineId = rl.purchaseOrderLineId;
            const totalLineReceived = (parseFloat(rl.acceptedQuantity) || 0) + (parseFloat(rl.damagedQuantity) || 0) + (parseFloat(rl.rejectedQuantity) || 0);
            shipmentReceivedByLine[lineId] = (shipmentReceivedByLine[lineId] || 0) + totalLineReceived;
          });
        }
      });
    }

    // Query ALL receipts belonging to the PO for invariant A (PO-wide accepted quantity limit)
    const existingPOReceipts = await Receipt.findAll({
      where: { purchaseOrderId: poId },
      include: [{ model: ReceiptLine, as: "lines" }],
      transaction
    });

    const existingPOAcceptedByLine = {};
    existingPOReceipts.forEach(r => {
      if (r.lines && Array.isArray(r.lines)) {
        r.lines.forEach(rl => {
          const lineId = rl.purchaseOrderLineId;
          existingPOAcceptedByLine[lineId] = (existingPOAcceptedByLine[lineId] || 0) + (parseFloat(rl.acceptedQuantity) || 0);
        });
      }
    });

    // Quantity Invariant Validation for each incoming receipt line
    for (const line of receiptData.lines) {
      const poLine = po.lines.find(l => l.id === line.purchaseOrderLineId);
      if (!poLine) {
        throw { statusCode: 400, message: `Purchase Order Line ${line.purchaseOrderLineId} does not belong to PO ${poId}` };
      }

      // Explicit non-negative finite numeric validation
      const rawAccepted = line.acceptedQuantity !== undefined && line.acceptedQuantity !== null ? line.acceptedQuantity : 0;
      const rawDamaged = line.damagedQuantity !== undefined && line.damagedQuantity !== null ? line.damagedQuantity : 0;
      const rawRejected = line.rejectedQuantity !== undefined && line.rejectedQuantity !== null ? line.rejectedQuantity : 0;

      const incomingAccepted = parseFloat(rawAccepted);
      const incomingDamaged = parseFloat(rawDamaged);
      const incomingRejected = parseFloat(rawRejected);

      if (!Number.isFinite(incomingAccepted) || incomingAccepted < 0) {
        throw { statusCode: 400, message: `Invalid acceptedQuantity '${rawAccepted}'. Quantity must be a non-negative finite number.` };
      }
      if (!Number.isFinite(incomingDamaged) || incomingDamaged < 0) {
        throw { statusCode: 400, message: `Invalid damagedQuantity '${rawDamaged}'. Quantity must be a non-negative finite number.` };
      }
      if (!Number.isFinite(incomingRejected) || incomingRejected < 0) {
        throw { statusCode: 400, message: `Invalid rejectedQuantity '${rawRejected}'. Quantity must be a non-negative finite number.` };
      }

      const incomingTotalReceived = incomingAccepted + incomingDamaged + incomingRejected;

      // Invariant A: Total Accepted Across PO <= PurchaseOrderLine.quantity
      const currentPOAccepted = existingPOAcceptedByLine[poLine.id] || 0;
      if (currentPOAccepted + incomingAccepted > parseFloat(poLine.quantity)) {
        throw {
          statusCode: 400,
          message: `Cumulative accepted quantity (${currentPOAccepted + incomingAccepted}) exceeds ordered PO line quantity (${poLine.quantity}).`
        };
      }

      // Invariant B: Total Received Across THIS Shipment <= ShipmentLine.quantityShipped
      if (shipment) {
        const shpLine = shipmentLines.find(sl => sl.purchaseOrderLineId === poLine.id);
        const shippedQty = shpLine ? parseFloat(shpLine.quantityShipped) : 0;
        const currentShipmentReceived = shipmentReceivedByLine[poLine.id] || 0;
        if (currentShipmentReceived + incomingTotalReceived > shippedQty) {
          throw {
            statusCode: 400,
            message: `Cumulative received quantity (${currentShipmentReceived + incomingTotalReceived}) exceeds shipped quantity (${shippedQty}) for shipment ${shipment.id}.`
          };
        }
      }
    }

    const receipt = await Receipt.create({
      purchaseOrderId: poId,
      shipmentId: receiptData.shipmentId || null,
      buyerId: buyerUserId,
      status: "pending_inspection",
      receivedAt: new Date()
    }, { transaction });

    for (const line of receiptData.lines) {
      await ReceiptLine.create({
        receiptId: receipt.id,
        purchaseOrderLineId: line.purchaseOrderLineId,
        acceptedQuantity: line.acceptedQuantity || 0,
        rejectedQuantity: line.rejectedQuantity || 0,
        damagedQuantity: line.damagedQuantity || 0,
        rejectionReason: line.rejectionReason || null
      }, { transaction });
    }

    const emitFn = () => emitOperationalEvent("RECEIPT_CREATED", "Receipt", receipt.id, "buyer", buyerUserId, { purchaseOrderId: poId, receiptId: receipt.id });
    if (deferEvents) {
      pendingEvents.push(emitFn);
    } else {
      emitFn();
    }

    return receipt;
  }

  static async acceptReceipt(receiptId, buyerUserId, transaction, options = {}) {
    const { deferEvents = false, pendingEvents = [] } = options;

    const receipt = await Receipt.findByPk(receiptId, { include: "lines", transaction });
    if (!receipt) throw { statusCode: 404, message: "Receipt not found" };

    if (receipt.status === "accepted") {
      return receipt; // Idempotency
    }

    await receipt.update({ status: "accepted" }, { transaction });

    for (const line of receipt.lines) {
      if (parseFloat(line.acceptedQuantity) > 0) {
        const emitFn = () => emitOperationalEvent("ITEM_ACCEPTED", "ReceiptLine", line.id, "buyer", buyerUserId, { purchaseOrderId: receipt.purchaseOrderId, receiptId: receipt.id, quantity: line.acceptedQuantity });
        if (deferEvents) pendingEvents.push(emitFn); else emitFn();
      }

      if (parseFloat(line.damagedQuantity) > 0) {
        const emitFn = () => emitOperationalEvent("ITEM_DAMAGED", "ReceiptLine", line.id, "buyer", buyerUserId, { purchaseOrderId: receipt.purchaseOrderId, receiptId: receipt.id, quantity: line.damagedQuantity });
        if (deferEvents) pendingEvents.push(emitFn); else emitFn();
      }

      if (parseFloat(line.rejectedQuantity) > 0) {
        const emitFn = () => emitOperationalEvent("ITEM_REJECTED", "ReceiptLine", line.id, "buyer", buyerUserId, { purchaseOrderId: receipt.purchaseOrderId, receiptId: receipt.id, quantity: line.rejectedQuantity });
        if (deferEvents) pendingEvents.push(emitFn); else emitFn();
      }
    }

    const emitAcceptedFn = () => emitOperationalEvent("RECEIPT_ACCEPTED", "Receipt", receipt.id, "buyer", buyerUserId, { purchaseOrderId: receipt.purchaseOrderId, receiptId: receipt.id });
    if (deferEvents) pendingEvents.push(emitAcceptedFn); else emitAcceptedFn();

    // Project physical state upward to PO
    await StateProjectionModule.projectPOState(receipt.purchaseOrderId, transaction);

    // Hand off to Inventory
    await InventoryProjectionModule.projectInventory(receiptId, buyerUserId, transaction);

    return receipt;
  }
}

module.exports = ReceiptModule;
