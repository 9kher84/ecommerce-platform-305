const { AuditLog } = require("../../sequelize_setup");
const { subscribeAll } = require("../../utils/EventBus");

class AuditLogConsumer {
  static initialize() {
    subscribeAll(async (event) => {
      try {
        await AuditLog.create({
          user_id: event.actor?.id || null,
          action: event.eventType,
          entity_type: event.aggregateType,
          entity_id: event.aggregateId,
          new_data: {
            eventId: event.id,
            version: event.version,
            recordedAt: new Date(),
            event: event
          }
        });
      } catch (err) {
        console.error(`[AuditLogConsumer] Failed to write event ${event.eventType} to AuditLog:`, err);
      }
    });
  }
}

module.exports = AuditLogConsumer;
