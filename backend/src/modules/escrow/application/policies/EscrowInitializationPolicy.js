const EscrowRepository = require('../../repositories/EscrowRepository');
const CreateEscrowUseCase = require('../use-cases/CreateEscrowUseCase');
const UnitOfWork = require('../../../../shared/application/UnitOfWork');
const TransactionManager = require('../../../../shared/application/TransactionManager');
const OutboxRepository = require('../../../../shared/infrastructure/outbox/OutboxRepository');
const PolicyExecutionMiddleware = require('../../../../shared/application/PolicyExecutionMiddleware');

class EscrowInitializationPolicy {
  /**
   * Consumes AwardConfirmedEvent and creates a new Escrow.
   * Idempotency handled by PolicyExecutionMiddleware and Inbox Pattern.
   */
  static get handle() {
    return PolicyExecutionMiddleware.wrap('EscrowInitializationPolicy', async (event, t) => {
      const { awardId, buyerOrganizationId, sellerOrganizationId, amount, currency } = event.payload;

      const escrowRepo = new EscrowRepository();
      const transactionManager = new TransactionManager();
      const outboxRepo = new OutboxRepository();
      const uow = new UnitOfWork({ transactionManager, outboxRepo });

      const createEscrowUseCase = new CreateEscrowUseCase({
        escrowRepo,
        uow
      });

      console.log(`[EscrowInitializationPolicy] Triggering CreateEscrowUseCase for Award ${awardId}...`);
      await createEscrowUseCase.execute({
        awardId: awardId,
        buyerOrganizationId: buyerOrganizationId,
        sellerOrganizationId: sellerOrganizationId,
        amount: amount,
        currency: currency,
        actorId: 'SYSTEM',
        correlationId: event.correlationId,
        causationId: event.eventId
      }, t);
    });
  }
}

module.exports = EscrowInitializationPolicy;
