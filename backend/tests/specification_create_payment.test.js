const CreatePaymentUseCase = require('../src/modules/payments/application/use-cases/CreatePaymentUseCase');
const PaymentRepository = require('../src/modules/payments/repositories/PaymentRepository');
const FakePaymentGatewayAdapter = require('../src/modules/payments/infrastructure/gateways/FakePaymentGatewayAdapter');
const TransactionManager = require('../src/shared/application/TransactionManager');
const EventBus = require('../src/shared/infrastructure/eventBus/EventBus');
const DomainException = require('../src/shared/domain/DomainException');

jest.mock('../src/modules/payments/repositories/PaymentRepository');
jest.mock('../src/shared/application/TransactionManager');
jest.mock('../src/shared/infrastructure/eventBus/EventBus');

describe('SPECIFICATION: CreatePaymentUseCase', () => {
  let useCase;
  let mockPaymentRepo;
  let mockTransactionManager;
  let mockGateway;

  beforeEach(() => {
    jest.clearAllMocks();

    mockPaymentRepo = new PaymentRepository();
    mockTransactionManager = new TransactionManager();
    mockGateway = new FakePaymentGatewayAdapter(false); // Success by default

    mockTransactionManager.execute.mockImplementation(async (callback) => {
      return callback('mock-transaction');
    });

    useCase = new CreatePaymentUseCase({
      paymentRepo: mockPaymentRepo,
      paymentGateway: mockGateway,
      transactionManager: mockTransactionManager
    });
  });

  it('1. Success: should create Payment, authorize it via Gateway, persist, and publish PaymentAuthorizedEvent', async () => {
    const command = {
      escrowId: 'escrow-123',
      awardId: 'award-456',
      amount: 1500,
      currency: 'SAR',
      provider: 'FakeGateway'
    };

    const payment = await useCase.execute(command);

    expect(payment.escrowId).toBe('escrow-123');
    expect(payment.status).toBe('authorized');
    expect(payment.providerReference).toMatch(/^fake_auth_/);

    // Initial save (initiated -> processing) and second save (authorized)
    expect(mockPaymentRepo.store).toHaveBeenCalledTimes(2);

    expect(EventBus.publish).toHaveBeenCalledWith(
      expect.objectContaining({
        name: 'PaymentAuthorizedEvent',
        aggregateId: payment.id,
        payload: expect.objectContaining({
          escrowId: 'escrow-123',
          amount: 1500,
          status: 'authorized'
        })
      })
    );
  });

  it('2. Gateway Failure: should handle Gateway rejection, transition to failed, and emit PaymentFailedEvent', async () => {
    useCase.paymentGateway = new FakePaymentGatewayAdapter(true); // Mock failure

    const command = {
      escrowId: 'escrow-123',
      awardId: 'award-456',
      amount: 1500,
      currency: 'SAR',
      provider: 'FakeGateway'
    };

    const payment = await useCase.execute(command);

    expect(payment.status).toBe('failed');
    expect(payment.failureReason).toBe('Insufficient funds in test card');

    expect(mockPaymentRepo.store).toHaveBeenCalledTimes(2);

    expect(EventBus.publish).toHaveBeenCalledWith(
      expect.objectContaining({
        name: 'PaymentFailedEvent',
        aggregateId: payment.id,
        payload: expect.objectContaining({
          status: 'failed',
          failureReason: 'Insufficient funds in test card'
        })
      })
    );
  });

  it('3. Domain Failure: should throw DomainException if amount is missing or invalid', async () => {
    const command = {
      escrowId: 'escrow-123',
      awardId: 'award-456',
      amount: -500, // Invalid
      currency: 'SAR',
      provider: 'FakeGateway'
    };

    await expect(useCase.execute(command)).rejects.toThrow(DomainException);
    expect(mockPaymentRepo.store).not.toHaveBeenCalled();
    expect(EventBus.publish).not.toHaveBeenCalled();
  });
});
