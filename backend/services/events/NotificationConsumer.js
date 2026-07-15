const { subscribe } = require("../../utils/EventBus");
const NotificationService = require("../notificationService");
const { User, PurchaseOrder, PurchaseOrderLine, Shipment, Receipt } = require("../../sequelize_setup");

class NotificationConsumer {
  static initialize() {
    subscribe("PO_ACCEPTED", async (event) => {
      try {
        const poId = event.aggregateId;
        const po = await PurchaseOrder.findByPk(poId);
        if (po) {
          await NotificationService.sendToUser(po.userId, "order", po.id, `Your Purchase Order #${po.poNumber} has been accepted.`);
        }
      } catch (err) {
        console.error("[NotificationConsumer] Error on PO_ACCEPTED", err);
      }
    });

    subscribe("SHIPMENT_DISPATCHED", async (event) => {
      try {
        const shipmentId = event.aggregateId;
        const shipment = await Shipment.findByPk(shipmentId);
        if (shipment) {
          const po = await PurchaseOrder.findByPk(shipment.purchaseOrderId);
          if (po) {
            await NotificationService.sendToUser(po.userId, "shipment", shipment.id, `Shipment ${shipment.trackingNumber} has been dispatched.`);
          }
        }
      } catch (err) {
        console.error("[NotificationConsumer] Error on SHIPMENT_DISPATCHED", err);
      }
    });

    subscribe("RECEIPT_ACCEPTED", async (event) => {
      try {
        const receiptId = event.aggregateId;
        const receipt = await Receipt.findByPk(receiptId);
        if (receipt) {
          const shipment = await Shipment.findByPk(receipt.shipmentId);
          if (shipment) {
            await NotificationService.sendToUser(shipment.sellerId, "receipt", receipt.id, `Receipt for shipment ${shipment.trackingNumber} has been accepted.`);
          }
        }
      } catch (err) {
        console.error("[NotificationConsumer] Error on RECEIPT_ACCEPTED", err);
      }
    });

    console.log("[NotificationConsumer] Initialized and listening to EventBus.");
  }
}

module.exports = NotificationConsumer;
