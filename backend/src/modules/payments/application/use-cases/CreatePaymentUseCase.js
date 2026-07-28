const { v4: uuidv4 } = require('uuid');
const Payment = require('../../domain/entities/Payment');

class CreatePaymentUseCase {
  /**
   * @param {Object} deps 
   * @param {import('../../repositories/PaymentRepository')} deps.paymentRepo
   * @param {import('../ports/PaymentGatewayPort')} deps.paymentGateway
   * @param {import('../../../../shared/application/UnitOfWork')} deps.uow
   */
  constructor({ paymentRepo, paymentGateway, uow }) {
    this.paymentRepo = paymentRepo;
    this.paymentGateway = paymentGateway;
    this.uow = uow;
  }

  /**
   * @param {Object} command 
   * @param {string} command.escrowId
   * @param {string} command.awardId
   * @param {number} command.amount
   * @param {string} command.currency
   * @param {string} command.provider
   * @param {string} [command.correlationId]
   * @param {string} [command.causationId]
   * @param {Object} [parentTransaction]
   */
  async execute(command, parentTransaction = null) {
    const paymentId = uuidv4();
    
    // 1. Initialize Domain
    const payment = Payment.create(paymentId, command);
    payment.process(); // Moving to processing before hitting the gateway

    // Inject IDs
    payment._domainEvents.forEach(e => {
       e.correlationId = command.correlationId;
       e.causationId = command.causationId;
    });

    // Save initial state to DB (in case gateway crashes, we have a record)
    await this.uow.commit([payment], async (t) => {
      await this.paymentRepo.store(payment, null, t);
    }, parentTransaction);

    // 2. Interact with External Provider via Port
    const gatewayResponse = await this.paymentGateway.authorize({
      paymentId: payment.id,
      amount: payment.amount,
      currency: payment.currency
    });

    // 3. Domain Transitions based on Gateway Response
    if (gatewayResponse.success) {
      payment.authorize(gatewayResponse.reference);
      // For immediate capture gateways, we could also call payment.capture() here
      // But the user requested separating authorized from captured.
    } else {
      payment.fail(gatewayResponse.error);
    }

    // Inject IDs for new events
    payment._domainEvents.forEach(e => {
       e.correlationId = command.correlationId;
       e.causationId = command.causationId;
    });

    // 4. Persistence Boundary (Update state)
    await this.uow.commit([payment], async (t) => {
      await this.paymentRepo.store(payment, payment.version - 1, t);
    }, parentTransaction);

    return payment;
  }
}

module.exports = CreatePaymentUseCase;
