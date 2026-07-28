const { v4: uuidv4 } = require('uuid');
const Escrow = require('../../domain/entities/Escrow');
const AppError = require('../../../../../utils/appError');

class CreateEscrowUseCase {
  /**
   * @param {Object} deps 
   * @param {import('../../repositories/EscrowRepository')} deps.escrowRepo
   * @param {import('../../../../shared/application/UnitOfWork')} deps.uow
   */
  constructor({ escrowRepo, uow }) {
    this.escrowRepo = escrowRepo;
    this.uow = uow;
  }

  /**
   * @param {Object} command 
   * @param {string} command.awardId
   * @param {string} command.buyerOrganizationId
   * @param {string} command.sellerOrganizationId
   * @param {number} command.amount
   * @param {string} command.currency
   * @param {string} [command.correlationId]
   * @param {string} [command.causationId]
   * @param {Object} [parentTransaction]
   */
  async execute(command, parentTransaction = null) {
    // 1. Escrow uniqueness is checked by the DB unique constraint on awardId.
    // The policy that triggers this should also perform a query-first idempotency check.

    const escrowId = uuidv4();
    const escrow = Escrow.create(escrowId, command);

    // Inject correlation and causation IDs
    escrow._domainEvents.forEach(e => {
       e.correlationId = command.correlationId;
       e.causationId = command.causationId;
    });

    // 2. Persistence Boundary
    await this.uow.commit([escrow], async (t) => {
      await this.escrowRepo.store(escrow, null, t);
    }, parentTransaction);

    return escrow;
  }
}

module.exports = CreateEscrowUseCase;
