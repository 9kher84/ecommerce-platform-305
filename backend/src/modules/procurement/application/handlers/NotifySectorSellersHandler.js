const RequestService = require('../../../../../services/requestService'); // Legacy service wrapper

class NotifySectorSellersHandler {
  /**
   * @param {import('../../domain/events/RequestPublishedEvent')} event 
   */
  static async handle(event) {
    try {
      // Extract the necessary payload for the legacy service.
      // Since legacy service expects a Sequelize instance or shape,
      // and we stripped it from Domain, we map it temporarily for the legacy call.
      // Or we can just pass the aggregate if legacy can read properties.
      
      const payload = event.aggregate._sequelizeInstance || event.aggregate;
      
      await RequestService.notifySectorSellers(payload);
      console.log(`[DomainEvent] Successfully notified sector sellers for request ${event.aggregate.id}`);
    } catch (err) {
      console.error("[DomainEvent] Sector Notification Error:", err);
    }
  }
}

module.exports = NotifySectorSellersHandler;
