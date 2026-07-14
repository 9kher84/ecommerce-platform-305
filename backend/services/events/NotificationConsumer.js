const { eventBus } = require("../../utils/EventBus");
const NotificationService = require("../NotificationService");

class NotificationConsumer {
  static initialize() {
    eventBus.on("PO_ACCEPTED", async (event) => {
      try {
        await NotificationService.sendToUser(event.actor.id, "system", {
          title: "Order Accepted",
          message: `Purchase Order ${event.aggregateId} has been accepted.`,
          entityType: "order",
          entityId: event.aggregateId
        });
      } catch (err) {
        console.error("[NotificationConsumer] Failed on PO_ACCEPTED:", err);
      }
    });

    eventBus.on("SHIPMENT_DISPATCHED", async (event) => {
      try {
        await NotificationService.sendToUser(event.actor.id, "system", {
          title: "Shipment Dispatched",
          message: `Shipment for order has been dispatched.`,
          entityType: "shipment",
          entityId: event.aggregateId
        });
      } catch (err) {
        console.error("[NotificationConsumer] Failed on SHIPMENT_DISPATCHED:", err);
      }
    });

    eventBus.on("RECEIPT_ACCEPTED", async (event) => {
      try {
        await NotificationService.sendToUser(event.actor.id, "system", {
          title: "Receipt Logged",
          message: `Receipt has been processed.`,
          entityType: "receipt",
          entityId: event.aggregateId
        });
      } catch (err) {
        console.error("[NotificationConsumer] Failed on RECEIPT_ACCEPTED:", err);
      }
    });

    console.log("[NotificationConsumer] Initialized and listening to EventBus.");
  }
}

module.exports = NotificationConsumer;
