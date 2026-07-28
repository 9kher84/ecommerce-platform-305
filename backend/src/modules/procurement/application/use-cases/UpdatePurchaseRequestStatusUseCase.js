const AppError = require('../../../../../utils/appError');
const { sequelize } = require('../../../../../sequelize_setup');

class UpdatePurchaseRequestStatusUseCase {
  /**
   * @param {Object} deps
   * @param {import('../ports/PurchaseRequestRepositoryPort')} deps.purchaseRequestRepo
   * @param {import('../../../../shared/application/TransactionManager')} deps.transactionManager
   */
  constructor({ purchaseRequestRepo, transactionManager }) {
    this.purchaseRequestRepo = purchaseRequestRepo;
    this.transactionManager = transactionManager;
  }

  /**
   * @param {Object} command 
   * @param {string} command.purchaseRequestId
   * @param {Array<string>} command.quotedItemIds
   */
  async execute(command) {
    const { purchaseRequestId, quotedItemIds } = command;

    const rfq = await this.purchaseRequestRepo.findById(purchaseRequestId);
    if (!rfq) {
      throw new AppError("Purchase Request not found.", 404);
    }

    // Domain Logic: Update RFQ status to quoting if it was published
    // Note: To strictly comply with Rule Zero (No Behavior Change), we apply the logic here.
    // Ideally this would be inside a `receiveQuote()` method in the PurchaseRequest aggregate.
    
    let isMutated = false;
    if (rfq.status === "published" || rfq.status === "rfq_published") {
      rfq.status = "quoting";
      isMutated = true;
    }

    if (rfq.items && quotedItemIds.length > 0) {
      rfq.items.forEach(item => {
        if (quotedItemIds.includes(item.id) && item.status === "pending") {
          item.status = "quoted";
          isMutated = true;
        }
      });
    }

    if (isMutated) {
      await this.transactionManager.execute(async (t) => {
        await this.purchaseRequestRepo.store(rfq, t);
      });

      // Dispatch Domain Events (Post-Commit)
      const EventBus = require('../../../../shared/infrastructure/eventBus/EventBus');
      rfq.pullEvents().forEach(event => {
        EventBus.publish(event);
      });
    }

    return rfq;
  }
}

module.exports = UpdatePurchaseRequestStatusUseCase;
