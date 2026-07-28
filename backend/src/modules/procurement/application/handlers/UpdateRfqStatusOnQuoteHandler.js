const UpdatePurchaseRequestStatusUseCase = require("../use-cases/UpdatePurchaseRequestStatusUseCase");
const PurchaseRequestRepository = require("../../repositories/PurchaseRequestRepository");

const TransactionManager = require("../../../../shared/application/TransactionManager");

// Dependency Injection
const purchaseRequestRepo = new PurchaseRequestRepository();
const transactionManager = new TransactionManager();
const updatePurchaseRequestStatusUseCase = new UpdatePurchaseRequestStatusUseCase({ purchaseRequestRepo, transactionManager });

class UpdateRfqStatusOnQuoteHandler {
  static async handle(event) {
    if (event.name !== "QuotationSubmittedEvent") return;

    try {
      const { aggregate } = event;
      
      const purchaseRequestId = aggregate.purchaseRequestId;
      const quotedItemIds = aggregate.items.map(i => i.purchaseRequestItemId);

      const command = {
        purchaseRequestId,
        quotedItemIds
      };

      // Call the UseCase to handle the cross-aggregate mutation properly
      await updatePurchaseRequestStatusUseCase.execute(command);
      
      console.log(`[DomainEvent] Successfully updated RFQ status for quotation ${aggregate.id}`);
    } catch (error) {
      console.error(`[DomainEvent] Error updating RFQ status for quotation ${event.aggregate.id}:`, error);
      // Depending on requirements, we might want to retry, alert, or log this failure.
    }
  }
}

module.exports = UpdateRfqStatusOnQuoteHandler;
