const AppError = require('../../../../../utils/appError');
const EventBus = require('../../../../shared/infrastructure/eventBus/EventBus');

class CancelAwardUseCase {
  /**
   * @param {Object} deps 
   * @param {import('../ports/AwardRepositoryPort')} deps.awardRepo
   * @param {import('../../../../shared/application/TransactionManager')} deps.transactionManager
   */
  constructor({ awardRepo, transactionManager }) {
    this.awardRepo = awardRepo;
    this.transactionManager = transactionManager;
  }

  /**
   * @param {Object} command 
   * @param {string} command.awardId
   * @param {string} command.reason
   * @param {string} command.actorId
   * @param {number} command.expectedVersion
   */
  async execute(command) {
    const { awardId, reason, actorId, expectedVersion } = command;

    const award = await this.awardRepo.findById(awardId);
    if (!award) {
      throw new AppError('Award not found', 404);
    }

    // 1. Domain Logic
    award.cancel(reason);

    // 2. Persistence Boundary
    await this.transactionManager.execute(async (t) => {
      await this.awardRepo.store(award, expectedVersion, t);
    });

    // 3. Post-Commit Event Dispatch
    award.pullEvents().forEach(event => {
      EventBus.publish(event);
    });

    return award;
  }
}

module.exports = CancelAwardUseCase;
