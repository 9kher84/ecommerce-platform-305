const FundEscrowUseCase = require('../src/modules/escrow/application/use-cases/FundEscrowUseCase');
const FundEscrowPolicy = require('../src/modules/escrow/application/policies/FundEscrowPolicy');
const EscrowRepository = require('../src/modules/escrow/repositories/EscrowRepository');
const TransactionManager = require('../src/shared/application/TransactionManager');
const EventBus = require('../src/shared/infrastructure/eventBus/EventBus');
const Escrow = require('../src/modules/escrow/domain/entities/Escrow');
const PaymentCapturedEvent = require('../src/modules/payments/domain/events/PaymentCapturedEvent');

jest.mock('../src/modules/escrow/repositories/EscrowRepository');
jest.mock('../src/shared/application/TransactionManager');
jest.mock('../src/shared/infrastructure/eventBus/EventBus');

describe('SPECIFICATION: FundEscrow', () => {
  let mockEscrow;
  let useCase;
  let mockEscrowRepo;
  let mockTransactionManager;

  beforeEach(() => {
    jest.clearAllMocks();

    mockEscrow = new Escrow({
      id: 'escrow-999',
      awardId: 'award-111',
      buyerId: 'buyer-456',
      sellerId: 'seller-789',
      amount: 5000,
      currency: 'SAR',
      version: 1,
      status: 'pending_funding'
    });

    mockEscrowRepo = new EscrowRepository();
    mockTransactionManager = new TransactionManager();

    EscrowRepository.prototype.findById.mockResolvedValue(mockEscrow);
    mockTransactionManager.execute.mockImplementation(async (callback) => {
      return callback('mock-transaction');
    });

    useCase = new FundEscrowUseCase({
      escrowRepo: mockEscrowRepo,
      transactionManager: mockTransactionManager
    });
  });

  describe('UseCase', () => {
    it('1. Success: should fund Escrow, persist, and publish EscrowFundedEvent', async () => {
      const command = {
        escrowId: 'escrow-999',
        timestamp: '2026-07-19T00:00:00Z'
      };

      const escrow = await useCase.execute(command);

      expect(escrow.status).toBe('funded');
      expect(mockEscrowRepo.store).toHaveBeenCalledTimes(1);

      expect(EventBus.publish).toHaveBeenCalledWith(
        expect.objectContaining({
          name: 'EscrowFundedEvent',
          aggregateId: 'escrow-999',
          payload: expect.objectContaining({
            status: 'funded',
            fundedAt: '2026-07-19T00:00:00Z'
          })
        })
      );
    });
  });

  describe('Policy (Process Manager)', () => {
    let mockEvent;

    beforeEach(() => {
      mockEvent = {
        payload: {
          escrowId: 'escrow-999',
          paymentId: 'pay-123',
          awardId: 'award-111',
          amount: 5000,
          currency: 'SAR',
          providerReference: 'stripe-abc',
          capturedAt: '2026-07-19T00:00:00Z'
        }
      };
      
      jest.spyOn(FundEscrowUseCase.prototype, 'execute').mockResolvedValue(mockEscrow);
    });

    afterEach(() => {
      jest.restoreAllMocks();
    });

    it('2. PM-04 (Query-First Idempotency): should trigger UseCase if Escrow is pending_funding', async () => {
      await FundEscrowPolicy.handle(mockEvent);

      expect(EscrowRepository.prototype.findById).toHaveBeenCalledWith('escrow-999');
      expect(FundEscrowUseCase.prototype.execute).toHaveBeenCalledWith({
        escrowId: 'escrow-999',
        timestamp: '2026-07-19T00:00:00Z'
      });
    });

    it('3. PM-04 (Query-First Idempotency): should ignore event if Escrow is already funded', async () => {
      mockEscrow.status = 'funded';
      EscrowRepository.prototype.findById.mockResolvedValue(mockEscrow);

      await FundEscrowPolicy.handle(mockEvent);

      expect(FundEscrowUseCase.prototype.execute).not.toHaveBeenCalled();
    });

    it('4. PM-06 (Failure Isolation): should bubble up unknown errors to EventBus', async () => {
      const error = new Error('Database down');
      jest.spyOn(FundEscrowUseCase.prototype, 'execute').mockRejectedValue(error);

      await expect(FundEscrowPolicy.handle(mockEvent)).rejects.toThrow('Database down');
    });

    it('5. PM-05 (Restart Safe): handles ConcurrencyException by bubbling up for retry', async () => {
      const ConcurrencyException = require('../src/shared/domain/ConcurrencyException');
      jest.spyOn(FundEscrowUseCase.prototype, 'execute').mockRejectedValue(new ConcurrencyException('Conflict'));

      await expect(FundEscrowPolicy.handle(mockEvent)).rejects.toThrow(ConcurrencyException);
    });
  });
});
