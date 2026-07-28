const DomainException = require('../../../../shared/domain/DomainException');

class FundEscrowUseCase {
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
   * @param {string} command.escrowId 
   * @param {string} command.timestamp 
   * @param {string} [command.correlationId]
   * @param {string} [command.causationId]
   * @param {Object} [parentTransaction]
   */
  async execute(command, parentTransaction = null) {
    const { escrowId, timestamp, correlationId, causationId } = command;

    const escrow = await this.escrowRepo.findById(escrowId);
    if (!escrow) {
      throw new DomainException(`Escrow ${escrowId} not found`, "NOT_FOUND");
    }

    // Delegate business logic to the Aggregate
    escrow.fund(timestamp);

    // Inject correlation and causation IDs
    escrow._domainEvents.forEach(e => {
       e.correlationId = correlationId;
       e.causationId = causationId;
    });

    // Persist
    await this.uow.commit([escrow], async (t) => {
      await this.escrowRepo.store(escrow, escrow.version - 1, t);
    }, parentTransaction);

    return escrow;
  }
}

module.exports = FundEscrowUseCase;
