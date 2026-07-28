const AppError = require('../../../../../utils/appError');
const EventBus = require('../../../../shared/infrastructure/eventBus/EventBus');

class WithdrawQuotationUseCase {
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
   * @param {string} command.sellerOrganizationId
   * @param {Date} command.timestamp
   */
  async execute(command) {
    const { quotationId, sellerOrganizationId, timestamp } = command;

    // 1. Load existing Aggregate
    const quote = await this.quotationRepo.findById(quotationId);
    if (!quote) {
      throw new AppError("Quotation not found.", 404);
    }

    // 2. Validate Ownership (Domain Rule delegated to Aggregate)
    quote.ensureOwnedBy(sellerOrganizationId);

    // 3. Domain Logic: Withdraw quote
    quote.withdraw(timestamp);

    // 4. Persistence with Transaction Boundary
    await this.transactionManager.execute(async (t) => {
      await this.quotationRepo.store(quote, t); 
    });

    // 5. Dispatch Domain Events (Post-Commit)
    // NOTE: Does not trigger cross-aggregate updates directly.
    quote.pullEvents().forEach(event => {
      EventBus.publish(event);
    });

    return quote;
  }
}

module.exports = WithdrawQuotationUseCase;
