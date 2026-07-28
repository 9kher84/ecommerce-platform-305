const AppError = require('../../../../../utils/appError');
const EventBus = require('../../../../shared/infrastructure/eventBus/EventBus');

class NegotiateQuotationUseCase {
  /**
   * @param {Object} deps
   * @param {import('../ports/QuotationRepositoryPort')} deps.quotationRepo
   * @param {import('../../../../shared/application/TransactionManager')} deps.transactionManager
   */
  constructor({ quotationRepo, transactionManager }) {
    this.quotationRepo = quotationRepo;
    this.transactionManager = transactionManager;
  }

  /**
   * @param {Object} command 
   * @param {string} command.quotationId
   * @param {Array<Object>} command.counterOfferItems
   * @param {Date} command.timestamp
   * @param {Object} context
   * @param {string} context.actorId
   * @param {string} context.buyerOrganizationId
   */
  async execute(command, context) {
    const { quotationId, counterOfferItems, timestamp } = command;

    // 1. Load existing Aggregate
    const quote = await this.quotationRepo.findById(quotationId);
    if (!quote) {
      throw new AppError("Quotation not found.", 404);
    }

    // Capture the expected version before mutation for Optimistic Locking
    const expectedVersion = quote.version;

    // 2. Validate Ownership/Permission (Assuming buyers negotiate)
    // For MVP, we'll assume the controller ensures the actor is a buyer.
    // In a real scenario, we might verify `quote.purchaseRequestId` belongs to `buyerOrganizationId`

    // 3. Domain Logic: Negotiate quote
    quote.negotiate(counterOfferItems, timestamp);

    // 4. Persistence with Transaction Boundary & Optimistic Lock
    await this.transactionManager.execute(async (t) => {
      // The repository will throw ConcurrencyException if the version does not match
      await this.quotationRepo.store(quote, expectedVersion, t); 
    });

    // 5. Dispatch Domain Events (Post-Commit)
    quote.pullEvents().forEach(event => {
      event.payload.context = context; // Enrich event context
      EventBus.publish(event);
    });

    return quote;
  }
}

module.exports = NegotiateQuotationUseCase;
