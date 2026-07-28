const AwardControllerV2 = require('../src/modules/sales/infrastructure/api/AwardControllerV2');
const Award = require('../src/modules/sales/domain/entities/Award');
const EventBus = require('../src/shared/infrastructure/eventBus/EventBus');
const TransactionManager = require('../src/shared/application/TransactionManager');
const DomainException = require('../src/shared/domain/DomainException');

// Mock dependencies
jest.mock('../src/modules/sales/repositories/AwardRepository');
const AwardRepository = require('../src/modules/sales/repositories/AwardRepository');
jest.mock('../src/shared/infrastructure/eventBus/EventBus', () => ({
  publish: jest.fn(),
  subscribe: jest.fn(),
}));
jest.mock('../src/shared/application/TransactionManager');

describe('SPECIFICATION: Award Lifecycle', () => {
  let mockAwardRepoInstance;
  let mockTransactionManagerInstance;
  let publishSpy;
  let mockReq;
  let mockRes;
  let initialAward;

  beforeEach(() => {
    jest.clearAllMocks();
    publishSpy = EventBus.publish;

    // Create a base valid award starting in "accepted" status
    initialAward = new Award({
      id: 'award-123',
      purchaseRequestId: 'pr-456',
      quotationId: 'q-123',
      sellerOrganizationId: 'org-789',
      status: 'accepted',
      version: 1,
      totalAmount: 1000
    });
    // Add lines manually or bypass check
    initialAward.lines = [{ id: 'line-1', productId: 'p-1', quantity: 1, unitPrice: 1000, quotationItemId: 'qi-1' }];

    mockAwardRepoInstance = {
      findById: jest.fn().mockResolvedValue(initialAward),
      store: jest.fn().mockResolvedValue(initialAward)
    };
    AwardRepository.mockImplementation(() => mockAwardRepoInstance);

    mockTransactionManagerInstance = {
      execute: jest.fn(async (cb) => { await cb({}); })
    };
    TransactionManager.mockImplementation(() => mockTransactionManagerInstance);

    mockReq = {
      params: { id: 'award-123' },
      user: { id: 'buyer-user-123' },
      body: { expectedVersion: 1 }
    };

    mockRes = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn()
    };
  });

  describe('AL-01 / AL-02: State Machine Rules', () => {
    
    it('1. Success: should confirm an accepted award, increment version, and emit AwardConfirmedEvent', async () => {
      await AwardControllerV2.confirmAward(mockReq, mockRes);

      expect(initialAward.status).toBe('confirmed');
      expect(initialAward.version).toBe(2);
      
      expect(mockAwardRepoInstance.store).toHaveBeenCalledWith(
        expect.objectContaining({ status: 'confirmed', version: 2 }),
        1,
        expect.anything()
      );

      expect(publishSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          name: "AwardConfirmedEvent",
          aggregateId: "award-123",
          aggregateVersion: 2
        })
      );
    });

    it('2. Failure: should throw if confirming an already confirmed award', async () => {
      initialAward.status = 'confirmed';

      await expect(AwardControllerV2.confirmAward(mockReq, mockRes)).rejects.toThrow(DomainException);
      expect(publishSpy).not.toHaveBeenCalled();
    });

    it('3. Success: should cancel an accepted award, increment version, and emit AwardCancelledEvent', async () => {
      mockReq.body.reason = "Decided not to proceed";
      await AwardControllerV2.cancelAward(mockReq, mockRes);

      expect(initialAward.status).toBe('cancelled');
      expect(initialAward.version).toBe(2);
      expect(initialAward.notes).toBe('Cancelled: Decided not to proceed');

      expect(publishSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          name: "AwardCancelledEvent",
          aggregateId: "award-123"
        })
      );
    });

    it('4. Success: should cancel a confirmed award', async () => {
      initialAward.status = 'confirmed';
      await AwardControllerV2.cancelAward(mockReq, mockRes);

      expect(initialAward.status).toBe('cancelled');
      expect(initialAward.version).toBe(2);
    });

    it('5. Failure: should throw if completing an unconfirmed award (accepted)', async () => {
      initialAward.status = 'accepted';

      await expect(AwardControllerV2.completeAward(mockReq, mockRes)).rejects.toThrow(DomainException);
      expect(initialAward.status).toBe('accepted');
    });

    it('6. Success: should complete a confirmed award and emit AwardCompletedEvent', async () => {
      initialAward.status = 'confirmed';

      await AwardControllerV2.completeAward(mockReq, mockRes);

      expect(initialAward.status).toBe('completed');
      expect(initialAward.version).toBe(2);

      expect(publishSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          name: "AwardCompletedEvent",
          aggregateId: "award-123"
        })
      );
    });

    it('7. Failure (Terminal State): should throw if mutating a cancelled award', async () => {
      initialAward.status = 'cancelled';

      await expect(AwardControllerV2.confirmAward(mockReq, mockRes)).rejects.toThrow("Cannot modify a cancelled Award. This is a terminal state.");
      await expect(AwardControllerV2.completeAward(mockReq, mockRes)).rejects.toThrow("Cannot modify a cancelled Award. This is a terminal state.");
      await expect(AwardControllerV2.cancelAward(mockReq, mockRes)).rejects.toThrow("Cannot modify a cancelled Award. This is a terminal state.");
    });

    it('8. Failure (Terminal State): should throw if mutating a completed award', async () => {
      initialAward.status = 'completed';

      await expect(AwardControllerV2.confirmAward(mockReq, mockRes)).rejects.toThrow("Cannot modify a completed Award. This is a terminal state.");
      await expect(AwardControllerV2.cancelAward(mockReq, mockRes)).rejects.toThrow("Cannot modify a completed Award. This is a terminal state.");
      await expect(AwardControllerV2.completeAward(mockReq, mockRes)).rejects.toThrow("Cannot modify a completed Award. This is a terminal state.");
    });
  });
});
