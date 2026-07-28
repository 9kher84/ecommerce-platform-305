const AppError = require('../../../../../utils/appError');
const EventBus = require('../../../../shared/infrastructure/eventBus/EventBus');
const { sequelize } = require('../../../../../sequelize_setup');
const Quotation = require('../../domain/entities/Quotation');
const QuotationSubmittedEvent = require('../../domain/events/QuotationSubmittedEvent');

class SubmitQuotationUseCase {
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
   * @param {string} command.purchaseRequestId
   * @param {string} command.sellerOrganizationId
   * @param {Array<Object>} command.items
   * @param {Object} context
   * @param {string} context.actorId
   */
  async execute(command, context) {
    const { purchaseRequestId, sellerOrganizationId, items } = command;
    const { actorId } = context;

    // 1. Fetch Dependencies (RFQ data)
    const rfq = await this.purchaseRequestRepo.findById(purchaseRequestId);
    if (!rfq) {
      throw new AppError("Purchase Request not found.", 404);
    }

    // 2. Fetch existing quotes for this seller to enforce domain invariants
    const existingQuotes = await this.quotationRepo.findByRequestAndSeller(purchaseRequestId, sellerOrganizationId);

    // 3. Create Domain Aggregate
    const newQuotation = new Quotation({
      purchaseRequestId,
      sellerOrganizationId,
      items
    });

    // 4. Execute Domain Logic
    // submit() throws DomainViolationException if rules are breached
    newQuotation.submit(rfq, existingQuotes);

    // 5. Transaction Boundary (Aggregate isolated)
    await this.transactionManager.execute(async (t) => {
      await this.quotationRepo.store(newQuotation, t);
    });

    // 6. Dispatch Domain Events
    newQuotation.pullEvents().forEach(event => {
      // Enrich event context if necessary (or aggregate can do it)
      event.context = context; 
      EventBus.publish(event);
    });

    return newQuotation;
  }
}

module.exports = SubmitQuotationUseCase;
