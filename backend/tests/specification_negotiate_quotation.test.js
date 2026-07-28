const { Quotation, QuotationItem, sequelize } = require("../sequelize_setup");
const QuotationControllerV2 = require("../src/modules/procurement/infrastructure/api/QuotationControllerV2");
const EventBus = require('../src/shared/infrastructure/eventBus/EventBus');
const ConcurrencyException = require('../src/shared/domain/ConcurrencyException');

jest.mock("../sequelize_setup", () => {
  const mTransaction = { commit: jest.fn(), rollback: jest.fn() };
  return {
    sequelize: { transaction: jest.fn().mockResolvedValue(mTransaction) },
    Quotation: { update: jest.fn(), findByPk: jest.fn() },
    QuotationItem: { bulkCreate: jest.fn().mockImplementation((items) => Promise.resolve(items.map((_, i) => ({ id: `new-id-${i}` })))), destroy: jest.fn() }
  };
});

describe("SPECIFICATION: NegotiateQuotation (Optimistic Locking & Versioning)", () => {
  let mockReq, mockRes;

  beforeEach(() => {
    jest.clearAllMocks();

    mockReq = {
      user: { id: "buyer-1", organization_id: "org-buyer" },
      params: { id: "quote-123" },
      body: {
        items: [
          {
            purchaseRequestItemId: "item-1",
            unitPrice: 85, // Buyer counters with lower price
            quantityOffered: 10
          }
        ]
      },
      ip: "127.0.0.1",
      headers: { "user-agent": "jest-test" }
    };

    mockRes = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn()
    };
  });

  it("1. Negotiation Success: should update status, bump version, and trigger event", async () => {
    // Arrange: Load quote at version 7
    Quotation.findByPk.mockResolvedValue({
      id: "quote-123",
      purchaseRequestId: "req-123",
      sellerOrganizationId: "org-seller", // Doesn't matter, UseCase assumes Controller validated buyer access
      status: "submitted",
      version: 7,
      items: [
        { id: "q-item-1", purchaseRequestItemId: "item-1", unitPrice: 100, quantityOffered: 10, calculateSubtotals: jest.fn() }
      ]
    });

    const mockPublish = jest.spyOn(EventBus, 'publish').mockImplementation(() => {});
    Quotation.update.mockResolvedValue([1]); // 1 row affected = successful optimistic lock

    // Act
    await QuotationControllerV2.negotiateQuotation(mockReq, mockRes);

    // Assert Version Bumping & Database Persistence
    expect(Quotation.update).toHaveBeenCalledWith(
      expect.objectContaining({
        status: "negotiating",
        version: 8 // Should be incremented
      }),
      expect.objectContaining({ 
        where: { id: "quote-123", version: 7 }, // Expected Version was 7
        transaction: expect.anything() 
      })
    );

    // Assert Event Dispatched correctly
    expect(mockPublish).toHaveBeenCalledWith(
      expect.objectContaining({
        name: "QuotationNegotiatedEvent",
        aggregateId: "quote-123",
        aggregateVersion: 8, // Event should capture the bumped version
        payload: expect.objectContaining({
          status: "negotiating",
          counterOfferItems: expect.any(Array)
        })
      })
    );

    // Assert API Response
    expect(mockRes.status).toHaveBeenCalledWith(200);
    expect(mockRes.json).toHaveBeenCalledWith(expect.objectContaining({
      success: true,
      quote: expect.objectContaining({
        id: "quote-123",
        status: "negotiating",
        version: 8
      })
    }));
  });

  it("2. Concurrency Failure: should throw ConcurrencyException when versions mismatch", async () => {
    // Arrange: Load quote at version 7
    Quotation.findByPk.mockResolvedValue({
      id: "quote-123",
      purchaseRequestId: "req-123",
      sellerOrganizationId: "org-seller",
      status: "submitted",
      version: 7,
      items: [
        { id: "q-item-1", purchaseRequestItemId: "item-1", unitPrice: 100, quantityOffered: 10, calculateSubtotals: jest.fn() }
      ]
    });

    // Simulate Optimistic Lock failure (another process already updated it, so WHERE id=? AND version=7 matches 0 rows)
    Quotation.update.mockResolvedValue([0]); 

    // Act & Assert
    await expect(QuotationControllerV2.negotiateQuotation(mockReq, mockRes))
      .rejects.toThrow(ConcurrencyException);
      
    // Verify it actually passes the correct error attributes
    try {
      await QuotationControllerV2.negotiateQuotation(mockReq, mockRes);
    } catch (error) {
      expect(error.name).toBe("ConcurrencyException");
      expect(error.aggregateId).toBe("quote-123");
      expect(error.expectedVersion).toBe(7);
      expect(error.actualVersion).toBe(8); // aggregate.version bumped in memory before failing save
    }
  });

  it("3. Version Integrity: tests the unbroken chain from Load -> Memory -> Event -> DB", async () => {
    // We already kind of tested this in test 1, but we can do a strict assertion block
    const mockQuoteModel = {
      id: "quote-xyz",
      version: 42,
      status: "submitted",
      items: [{ purchaseRequestItemId: "item-1", unitPrice: 10, calculateSubtotals: jest.fn() }]
    };
    Quotation.findByPk.mockResolvedValue(mockQuoteModel);
    Quotation.update.mockResolvedValue([1]);
    const mockPublish = jest.spyOn(EventBus, 'publish').mockImplementation(() => {});

    await QuotationControllerV2.negotiateQuotation(mockReq, mockRes);

    // 1. Expected DB Update WHERE clause: version = 42
    expect(Quotation.update).toHaveBeenCalledWith(
      expect.objectContaining({ version: 43 }),
      expect.objectContaining({ where: { id: "quote-xyz", version: 42 } })
    );

    // 2. Event contains aggregateVersion = 43
    expect(mockPublish).toHaveBeenCalledWith(
      expect.objectContaining({ aggregateVersion: 43 })
    );

    // 3. API returns version 43
    expect(mockRes.json).toHaveBeenCalledWith(expect.objectContaining({
      quote: expect.objectContaining({ version: 43 })
    }));
  });
});
