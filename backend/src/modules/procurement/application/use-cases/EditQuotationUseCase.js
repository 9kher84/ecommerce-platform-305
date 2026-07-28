const AppError = require('../../../../../utils/appError');
const EventBus = require('../../../../shared/infrastructure/eventBus/EventBus');

class EditQuotationUseCase {
  /**
   * @param {Object} deps
   * @param {import('../ports/QuotationRepositoryPort')} deps.quotationRepo
   * @param {import('../ports/PurchaseRequestRepositoryPort')} deps.purchaseRequestRepo
   * @param {import('../../../../shared/application/TransactionManager')} deps.transactionManager
   */
  constructor({ quotationRepo, purchaseRequestRepo, transactionManager }) {
    this.quotationRepo = quotationRepo;
    this.purchaseRequestRepo = purchaseRequestRepo;
    this.transactionManager = transactionManager;
  }

  /**
   * @param {Object} command 
   * @param {string} command.quotationId
   * @param {Array<Object>} command.newItems
   * @param {Object} context
   * @param {string} context.actorId
   */
  async execute(command, context) {
    const { quotationId, newItems } = command;

    // 1. Load existing Aggregate
    const oldQuote = await this.quotationRepo.findById(quotationId);
    if (!oldQuote) {
      throw new AppError("Quotation not found.", 404);
    }

    // Optional: Validate that actor owns the quote
    // if (oldQuote.sellerOrganizationId !== context.sellerOrganizationId) ...

    // 2. Load RFQ to validate new quote submission later
    const rfq = await this.purchaseRequestRepo.findById(oldQuote.purchaseRequestId);
    if (!rfq) {
      throw new AppError("Purchase Request not found.", 404);
    }

    // 3. Domain Logic: Supersede old quote and create new one
    oldQuote.supersede();
    
    const Quotation = require('../../domain/entities/Quotation');
    const newQuote = Quotation.createFromSuperseded(oldQuote, newItems);
    
    // We pass empty array for existingQuotes because we just superseded the active one
    newQuote.submit(rfq, []); 

    // 4. Persistence with Transaction Boundary
    await this.transactionManager.execute(async (t) => {
      await this.quotationRepo.store(oldQuote, t); // Updates status to superseded
      await this.quotationRepo.store(newQuote, t); // Creates new quote and items
    });

    // 5. Dispatch Domain Events (Post-Commit)
    const eventsToPublish = [...oldQuote.pullEvents(), ...newQuote.pullEvents()];
    
    eventsToPublish.forEach(event => {
      event.context = context; // Enrich
      EventBus.publish(event);
    });

    return newQuote;
  }
}

module.exports = EditQuotationUseCase;
