const AppError = require('../../../../../utils/appError');

class ConfirmAwardUseCase {
  /**
   * @param {Object} deps 
   * @param {import('../ports/AwardRepositoryPort')} deps.awardRepo
   * @param {import('../../../../shared/application/UnitOfWork')} deps.uow
   */
  constructor({ awardRepo, uow }) {
    this.awardRepo = awardRepo;
    this.uow = uow;
  }

  /**
   * @param {Object} command 
   * @param {string} command.awardId
   * @param {string} command.actorId
   * @param {number} command.expectedVersion
   * @param {string} [command.correlationId]
   * @param {string} [command.causationId]
   * @param {Object} [parentTransaction]
   */
  async execute(command, parentTransaction = null) {
    const { awardId, actorId, expectedVersion, correlationId, causationId } = command;

    const award = await this.awardRepo.findById(awardId);
    if (!award) {
      throw new AppError('Award not found', 404);
    }

    // Authorization check would normally go here (e.g. check if actorId is the buyer)
    // if (!authorization.canConfirmAward(actorId, award)) throw Forbidden...

    // 1. Domain Logic
    award.confirm();

    // Inject correlation and causation IDs
    award._domainEvents.forEach(e => {
       e.correlationId = correlationId;
       e.causationId = causationId;
    });

    // 2. Persistence Boundary
    await this.uow.commit([award], async (t) => {
      await this.awardRepo.store(award, expectedVersion, t);
    }, parentTransaction);

    return award;
  }
}

module.exports = ConfirmAwardUseCase;
