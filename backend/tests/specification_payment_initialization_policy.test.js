const PaymentInitializationPolicy = require('../src/modules/payments/application/policies/PaymentInitializationPolicy');
const PaymentRepository = require('../src/modules/payments/repositories/PaymentRepository');
const CreatePaymentUseCase = require('../src/modules/payments/application/use-cases/CreatePaymentUseCase');
const EscrowCreatedEvent = require('../src/modules/escrow/domain/events/EscrowCreatedEvent');
const Escrow = require('../src/modules/escrow/domain/entities/Escrow');

jest.mock('../src/modules/payments/repositories/PaymentRepository');
jest.mock('../src/modules/payments/application/use-cases/CreatePaymentUseCase');

describe('SPECIFICATION: PaymentInitializationPolicy (Process Manager)', () => {
  let mockEscrow;
  let mockEvent;

  beforeEach(() => {
    jest.clearAllMocks();

    mockEscrow = new Escrow({
      id: 'escrow-999',
      awardId: 'award-111',
      buyerId: 'buyer-456',
      sellerId: 'seller-789',
      amount: 5000,
      currency: 'SAR',
      version: 1
    });

    mockEvent = new EscrowCreatedEvent({ aggregate: mockEscrow });

    PaymentRepository.prototype.findByEscrowId.mockResolvedValue(null);
  });

  it('1. PM-03: Should trigger CreatePaymentUseCase when receiving EscrowCreatedEvent', async () => {
    await PaymentInitializationPolicy.handle(mockEvent);

    expect(PaymentRepository.prototype.findByEscrowId).toHaveBeenCalledWith('escrow-999');
    expect(CreatePaymentUseCase.prototype.execute).toHaveBeenCalledWith(
      expect.objectContaining({
        escrowId: 'escrow-999',
        awardId: 'award-111',
        amount: 5000,
        currency: 'SAR',
        provider: 'FakeGateway'
      })
    );
  });

  it('2. PM-04: Should be Idempotent (Ignore event if Payment already exists - Query First)', async () => {
    // Simulate query first hit
    PaymentRepository.prototype.findByEscrowId.mockResolvedValue({ id: 'existing-payment' });

    await PaymentInitializationPolicy.handle(mockEvent);

    expect(CreatePaymentUseCase.prototype.execute).not.toHaveBeenCalled();
  });

  it('3. PM-04/PM-05: Should handle Race Condition gracefully (UniqueConstraintError)', async () => {
    const uniqueConstraintError = new Error('Validation error');
    uniqueConstraintError.name = 'SequelizeUniqueConstraintError';

    CreatePaymentUseCase.prototype.execute.mockRejectedValue(uniqueConstraintError);

    // Should not throw
    await expect(PaymentInitializationPolicy.handle(mockEvent)).resolves.not.toThrow();
  });

  it('4. PM-06: Failure Isolation (Should throw normal errors to EventBus)', async () => {
    const normalError = new Error('Gateway Connection Failed');
    
    CreatePaymentUseCase.prototype.execute.mockRejectedValue(normalError);

    // Should throw to let EventBus retry/DLQ
    await expect(PaymentInitializationPolicy.handle(mockEvent)).rejects.toThrow('Gateway Connection Failed');
  });
});
