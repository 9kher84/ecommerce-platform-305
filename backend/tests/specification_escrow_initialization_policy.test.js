const EscrowInitializationPolicy = require('../src/modules/escrow/application/policies/EscrowInitializationPolicy');
const EscrowRepository = require('../src/modules/escrow/repositories/EscrowRepository');
const CreateEscrowUseCase = require('../src/modules/escrow/application/use-cases/CreateEscrowUseCase');
const AwardConfirmedEvent = require('../src/modules/sales/domain/events/AwardConfirmedEvent');
const Award = require('../src/modules/sales/domain/entities/Award');

jest.mock('../src/modules/escrow/repositories/EscrowRepository');
jest.mock('../src/modules/escrow/application/use-cases/CreateEscrowUseCase');

describe('SPECIFICATION: EscrowInitializationPolicy (Process Manager)', () => {
  let mockAward;
  let mockEvent;

  beforeEach(() => {
    jest.clearAllMocks();

    mockAward = new Award({
      id: 'award-999',
      purchaseRequestId: 'pr-111',
      quotationId: 'q-222',
      buyerOrganizationId: 'buyer-456',
      sellerOrganizationId: 'seller-789',
      status: 'confirmed',
      totalAmount: 5000,
      version: 2
    });

    mockEvent = new AwardConfirmedEvent({ aggregate: mockAward, buyerOrganizationId: 'buyer-456' });

    EscrowRepository.prototype.findByAwardId.mockResolvedValue(null);
  });

  it('1. PM-03: Should trigger CreateEscrowUseCase when receiving AwardConfirmedEvent', async () => {
    await EscrowInitializationPolicy.handle(mockEvent);

    expect(EscrowRepository.prototype.findByAwardId).toHaveBeenCalledWith('award-999');
    expect(CreateEscrowUseCase.prototype.execute).toHaveBeenCalledWith(
      expect.objectContaining({
        awardId: 'award-999',
        buyerId: 'buyer-456',
        sellerId: 'seller-789',
        amount: 5000,
        currency: 'SAR'
      })
    );
  });

  it('2. PM-04: Should be Idempotent (Ignore event if Escrow already exists - Query First)', async () => {
    // Simulate query first hit
    EscrowRepository.prototype.findByAwardId.mockResolvedValue({ id: 'existing-escrow' });

    await EscrowInitializationPolicy.handle(mockEvent);

    expect(CreateEscrowUseCase.prototype.execute).not.toHaveBeenCalled();
  });

  it('3. PM-04/PM-05: Should handle Race Condition gracefully (UniqueConstraintError)', async () => {
    const uniqueConstraintError = new Error('Validation error');
    uniqueConstraintError.name = 'SequelizeUniqueConstraintError';

    CreateEscrowUseCase.prototype.execute.mockRejectedValue(uniqueConstraintError);

    // Should not throw
    await expect(EscrowInitializationPolicy.handle(mockEvent)).resolves.not.toThrow();
  });

  it('4. PM-06: Failure Isolation (Should throw normal errors to EventBus)', async () => {
    const normalError = new Error('Database connection failed');
    
    CreateEscrowUseCase.prototype.execute.mockRejectedValue(normalError);

    // Should throw to let EventBus retry/DLQ
    await expect(EscrowInitializationPolicy.handle(mockEvent)).rejects.toThrow('Database connection failed');
  });
});
