const EscrowRepository = require('../../repositories/EscrowRepository');
const FundEscrowUseCase = require('../use-cases/FundEscrowUseCase');
const UnitOfWork = require('../../../../shared/application/UnitOfWork');
const TransactionManager = require('../../../../shared/application/TransactionManager');
const OutboxRepository = require('../../../../shared/infrastructure/outbox/OutboxRepository');
const PolicyExecutionMiddleware = require('../../../../shared/application/PolicyExecutionMiddleware');

class FundEscrowPolicy {
  /**
   * Consumes PaymentAuthorizedEvent and funds the Escrow.
   * Idempotency handled by PolicyExecutionMiddleware and Inbox Pattern.
   */
  static get handle() {
    return PolicyExecutionMiddleware.wrap('FundEscrowPolicy', async (event, t) => {
      const { escrowId, timestamp } = event.payload;

      const escrowRepo = new EscrowRepository();
      const transactionManager = new TransactionManager();
      const outboxRepo = new OutboxRepository();
      const uow = new UnitOfWork({ transactionManager, outboxRepo });

      const fundEscrowUseCase = new FundEscrowUseCase({
        escrowRepo,
        uow
      });

      console.log(`[FundEscrowPolicy] Triggering FundEscrowUseCase for Escrow ${escrowId}...`);
      await fundEscrowUseCase.execute({
        escrowId: escrowId,
        timestamp: timestamp,
        correlationId: event.correlationId,
        causationId: event.eventId
      }, t);
    });
  }
}

module.exports = FundEscrowPolicy;
