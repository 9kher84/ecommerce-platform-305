const { eventBus } = require("../../utils/EventBus");
const { SLARecord } = require("../../sequelize_setup");

class SLAConsumer {
  static initialize() {
    eventBus.on("PO_ACCEPTED", async (event) => {
      try {
        // Create an SLA for shipment dispatch (e.g. 48 hours from PO_ACCEPTED)
        const deadline = new Date(event.occurredAt.getTime() + 48 * 60 * 60 * 1000);
        await SLARecord.create({
          referenceType: "PurchaseOrder",
          referenceId: event.aggregateId,
          startedAt: event.occurredAt,
          deadlineAt: deadline,
          status: "ACTIVE"
        });
      } catch (err) {
        console.error("[SLAConsumer] Failed to create SLA for PO_ACCEPTED:", err);
      }
    });

    eventBus.on("SHIPMENT_DISPATCHED", async (event) => {
      try {
        // Complete the SLA for the associated PO
        // Note: In reality, we'd look up the PO ID from the shipment, but for MVP we might just update based on Shipment if we passed it in payload.
        // Assuming payload contains purchaseOrderId
        const poId = event.payload?.purchaseOrderId;
        if (poId) {
          const record = await SLARecord.findOne({ where: { referenceType: "PurchaseOrder", referenceId: poId, status: "ACTIVE" }});
          if (record) {
            await record.update({
              completedAt: event.occurredAt,
              status: event.occurredAt > record.deadlineAt ? "BREACHED" : "COMPLETED"
            });
          }
        }
      } catch (err) {
        console.error("[SLAConsumer] Failed to resolve SLA for SHIPMENT_DISPATCHED:", err);
      }
    });

    console.log("[SLAConsumer] Initialized and listening to EventBus.");
  }
}

module.exports = SLAConsumer;
