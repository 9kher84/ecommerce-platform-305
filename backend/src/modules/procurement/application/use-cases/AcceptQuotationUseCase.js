const AppError = require('../../../../../utils/appError');
const EventBus = require('../../../../../shared/infrastructure/eventBus/EventBus');

class AcceptQuotationUseCase {
  /**
   * @param {Object} deps 
   * @param {import('../ports/QuotationRepositoryPort')} deps.quotationRepo
   * @param {import('../../../../../shared/application/TransactionManager')} deps.transactionManager
   */
  constructor({ quotationRepo, transactionManager }) {
    this.quotationRepo = quotationRepo;
    this.transactionManager = transactionManager;
  }

  /**
   * @param {Object} command 
   * @param {string} command.quotationId
   * @param {string} command.buyerOrganizationId
   * @param {number} command.expectedVersion
   */
  async execute(command) {
    const { quotationId, buyerOrganizationId, expectedVersion } = command;

    const quotation = await this.quotationRepo.findById(quotationId);
    if (!quotation) {
      throw new AppError('Quotation not found', 404);
    }

    // In a real application, we'd also check if the buyerOrganizationId matches the PR's buyer.
    // However, the PR is an external aggregate. Usually, policies or authorization handlers do this.

    // 1. Domain Logic
    quotation.accept({ buyerOrganizationId });

    // 2. Persistence Boundary
    await this.transactionManager.execute(async (t) => {
      await this.quotationRepo.store(quotation, expectedVersion, t);
    });

    // 3. Post-Commit Event Dispatch
    quotation.pullEvents().forEach(event => {
      EventBus.publish(event);
    });

    return quotation;
  }
}

module.exports = AcceptQuotationUseCase;
