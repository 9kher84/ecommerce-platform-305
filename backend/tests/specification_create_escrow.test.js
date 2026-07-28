const CreateEscrowUseCase = require('../src/modules/escrow/application/use-cases/CreateEscrowUseCase');
const EscrowRepository = require('../src/modules/escrow/repositories/EscrowRepository');
const TransactionManager = require('../src/shared/application/TransactionManager');
const EventBus = require('../src/shared/infrastructure/eventBus/EventBus');
const DomainException = require('../src/shared/domain/DomainException');

jest.mock('../src/modules/escrow/repositories/EscrowRepository');
jest.mock('../src/shared/application/TransactionManager');
jest.mock('../src/shared/infrastructure/eventBus/EventBus');

describe('SPECIFICATION: CreateEscrowUseCase', () => {
  let useCase;
  let mockEscrowRepo;
  let mockTransactionManager;

  beforeEach(() => {
    jest.clearAllMocks();

    mockEscrowRepo = new EscrowRepository();
    mockTransactionManager = new TransactionManager();

    mockTransactionManager.execute.mockImplementation(async (callback) => {
      return callback('mock-transaction');
    });

    useCase = new CreateEscrowUseCase({
      escrowRepo: mockEscrowRepo,
      transactionManager: mockTransactionManager
    });
  });

  it('1. Success: should create Escrow, persist it, and publish EscrowCreatedEvent', async () => {
    const command = {
      awardId: 'award-123',
      buyerId: 'buyer-456',
      sellerId: 'seller-789',
      amount: 1500,
      currency: 'SAR'
    };

    const escrow = await useCase.execute(command);

    expect(escrow.awardId).toBe('award-123');
    expect(escrow.status).toBe('pending_funding');

    expect(mockEscrowRepo.store).toHaveBeenCalledWith(
      expect.objectContaining({ awardId: 'award-123' }),
      null,
      'mock-transaction'
    );

    expect(EventBus.publish).toHaveBeenCalledWith(
      expect.objectContaining({
        name: 'EscrowCreatedEvent',
        aggregateId: escrow.id,
        payload: expect.objectContaining({
          awardId: 'award-123',
          amount: 1500
        })
      })
    );
  });

  it('2. Failure: should throw DomainException if amount is missing or invalid', async () => {
    const command = {
      awardId: 'award-123',
      buyerId: 'buyer-456',
      sellerId: 'seller-789',
      amount: -500 // Invalid
    };

    await expect(useCase.execute(command)).rejects.toThrow(DomainException);
    expect(mockEscrowRepo.store).not.toHaveBeenCalled();
    expect(EventBus.publish).not.toHaveBeenCalled();
  });
});
