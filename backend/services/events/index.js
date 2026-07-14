const AuditLogConsumer = require("./AuditLogConsumer");
const InventoryService = require("../inventory/InventoryService");

const initializeEventConsumers = () => {
  console.log("[EventBus] Initializing consumers...");
  AuditLogConsumer.initialize();
  console.log("[EventBus] AuditLogConsumer initialized.");
  
  InventoryService.initialize();

  const NotificationConsumer = require("./NotificationConsumer");
  NotificationConsumer.initialize();

  const SLAConsumer = require("./SLAConsumer");
  SLAConsumer.initialize();
};

module.exports = {
  initializeEventConsumers
};
