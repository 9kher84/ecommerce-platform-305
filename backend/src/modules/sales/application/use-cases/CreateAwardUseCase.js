const AppError = require('../../../../../utils/appError');
const Award = require('../../domain/entities/Award');

class CreateAwardUseCase {
  /**
   * @param {Object} deps 
   * @param {import('../ports/AwardRepositoryPort')} deps.awardRepo
   * @param {import('../../../procurement/application/ports/QuotationRepositoryPort')} deps.quotationRepo
   * @param {import('../../../../shared/application/UnitOfWork')} deps.uow
   */
  constructor({ awardRepo, quotationRepo, uow }) {
    this.awardRepo = awardRepo;
    this.quotationRepo = quotationRepo;
    this.uow = uow;
  }

  /**
   * @param {Object} command 
   * @param {string} command.quotationId
   * @param {string} command.actorId
   * @param {string} [command.buyerOrganizationId]
   * @param {string} [command.notes]
   * @param {Object} [parentTransaction]
   */
  async execute(command, parentTransaction = null) {
    const { quotationId, actorId, notes } = command;

    // 1. Fetch Quotation (Read-only, no mutation in this use-case for Quotation)
    const quotation = await this.quotationRepo.findById(quotationId);
    if (!quotation) {
      throw new AppError('Quotation not found', 404);
    }

    if (quotation.status !== 'accepted') {
      throw new AppError('Award can only be created for an accepted quotation', 400);
    }

    // 2. Build Award creation command
    const awardCommand = {
      purchaseRequestId: quotation.purchaseRequestId,
      quotationId: quotation.id,
      buyerOrganizationId: command.buyerOrganizationId || 'unknown-buyer', // We should receive it from the event
      sellerOrganizationId: quotation.sellerOrganizationId,
      notes: notes,
      lines: quotation.items.map(item => ({
        purchaseRequestItemId: item.purchaseRequestItemId,
        quotationItemId: item.id,
        sellerOrganizationId: quotation.sellerOrganizationId,
        productDNAId: item.productDNAId,
        quantityAwarded: item.quantityOffered || item.quantity,
        unitPriceAwarded: item.unitPrice,
        currency: item.currency || 'SAR',
        taxRate: item.taxRate || 15,
        discount: item.discount || 0,
        leadTime: item.leadTime,
        notes: item.notes,
        // Snapshot is immutable reference to the quotation data
        snapshot: {
          quotationId: quotation.id,
          itemId: item.id,
          unitPrice: item.unitPrice,
          quantity: item.quantityOffered || item.quantity,
          attributes: item.attributes || {}
        }
      }))
    };

    // 3. Domain Logic (Instantiate & Validate)
    const award = Award.create(awardCommand);
    
    // Inject correlation and causation IDs into the aggregates events
    award._domainEvents.forEach(e => {
       e.correlationId = command.correlationId;
       e.causationId = command.causationId;
    });

    // 4. Persistence Boundary (Atomic Commit using UnitOfWork)
    const expectedVersion = 0;
    
    await this.uow.commit([award], async (t) => {
      await this.awardRepo.store(award, expectedVersion, t);
    }, parentTransaction);

    return award;
  }
}

module.exports = CreateAwardUseCase;
