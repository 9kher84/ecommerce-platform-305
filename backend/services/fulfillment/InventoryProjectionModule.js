const { emitOperationalEvent } = require("../../utils/EventBus");

class InventoryProjectionModule {
  static async projectInventory(receiptId, buyerUserId, transaction) {
    emitOperationalEvent("RECEIPT_ACCEPTED", "Receipt", receiptId, "buyer", buyerUserId, { receiptId });
    return true;
  }
}

module.exports = InventoryProjectionModule;
