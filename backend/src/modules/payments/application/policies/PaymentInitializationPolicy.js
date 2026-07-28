const PaymentRepository = require('../../repositories/PaymentRepository');
const CreatePaymentUseCase = require('../use-cases/CreatePaymentUseCase');
const PaymentGatewayPort = require('../ports/PaymentGatewayPort');
const UnitOfWork = require('../../../../shared/application/UnitOfWork');
const TransactionManager = require('../../../../shared/application/TransactionManager');
const OutboxRepository = require('../../../../shared/infrastructure/outbox/OutboxRepository');
const PolicyExecutionMiddleware = require('../../../../shared/application/PolicyExecutionMiddleware');

class PaymentInitializationPolicy {
  /**
   * Consumes EscrowCreatedEvent and initiates the payment process.
   * Idempotency handled by PolicyExecutionMiddleware and Inbox Pattern.
   */
  static get handle() {
    return PolicyExecutionMiddleware.wrap('PaymentInitializationPolicy', async (event, t) => {
      const { escrowId, awardId, amount, currency } = event.payload;

      const paymentRepo = new PaymentRepository();
      const transactionManager = new TransactionManager();
      const outboxRepo = new OutboxRepository();
      const uow = new UnitOfWork({ transactionManager, outboxRepo });
      const paymentGateway = new PaymentGatewayPort(); // In a real app, inject Stripe/HyperPay Adapter

      const createPaymentUseCase = new CreatePaymentUseCase({
        paymentRepo,
        paymentGateway,
        uow
      });

      console.log(`[PaymentInitializationPolicy] Triggering CreatePaymentUseCase for Escrow ${escrowId}...`);
      await createPaymentUseCase.execute({
        escrowId: escrowId,
        awardId: awardId,
        amount: amount,
        currency: currency,
        provider: 'Stripe', // For demo purposes. We'd determine this via routing or user input.
        correlationId: event.correlationId,
        causationId: event.eventId
      }, t);
    });
  }
}

module.exports = PaymentInitializationPolicy;
