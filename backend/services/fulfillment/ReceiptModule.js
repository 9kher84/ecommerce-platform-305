const { Receipt, ReceiptLine } = require("../../sequelize_setup");
const StateProjectionModule = require("./StateProjectionModule");
const InventoryProjectionModule = require("./InventoryProjectionModule");
const { emitOperationalEvent } = require("../../utils/EventBus");

class ReceiptModule {
  static async logReceipt(poId, buyerUserId, receiptData, transaction) {
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

    emitOperationalEvent("RECEIPT_CREATED", "Receipt", receipt.id, "buyer", buyerUserId, { purchaseOrderId: poId, receiptId: receipt.id });

    return receipt;
  }

  static async acceptReceipt(receiptId, buyerUserId, transaction) {
    const receipt = await Receipt.findByPk(receiptId, { include: "lines", transaction });
    if (!receipt) throw new Error("Receipt not found");

    await receipt.update({ status: "accepted" }, { transaction });

    for (const line of receipt.lines) {
      if (parseFloat(line.acceptedQuantity) > 0) {
        emitOperationalEvent("ITEM_ACCEPTED", "ReceiptLine", line.id, "buyer", buyerUserId, { purchaseOrderId: receipt.purchaseOrderId, receiptId: receipt.id, quantity: line.acceptedQuantity });
      }

      if (parseFloat(line.damagedQuantity) > 0) {
        emitOperationalEvent("ITEM_DAMAGED", "ReceiptLine", line.id, "buyer", buyerUserId, { purchaseOrderId: receipt.purchaseOrderId, receiptId: receipt.id, quantity: line.damagedQuantity });
      }

      if (parseFloat(line.rejectedQuantity) > 0) {
        emitOperationalEvent("ITEM_REJECTED", "ReceiptLine", line.id, "buyer", buyerUserId, { purchaseOrderId: receipt.purchaseOrderId, receiptId: receipt.id, quantity: line.rejectedQuantity });
      }
    }

    // Project state upward to PO
    const newStatus = await StateProjectionModule.projectPOState(receipt.purchaseOrderId, transaction);

    if (newStatus === "received") {
        emitOperationalEvent("PO_COMPLETED", "PurchaseOrder", receipt.purchaseOrderId, "system", buyerUserId, { purchaseOrderId: receipt.purchaseOrderId });
    }

    // Hand off to Inventory
    await InventoryProjectionModule.projectInventory(receiptId, buyerUserId, transaction);

    return receipt;
  }
}

module.exports = ReceiptModule;
