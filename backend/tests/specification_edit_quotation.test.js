const { Quotation, QuotationItem, PurchaseRequest, PurchaseRequestItem, sequelize } = require("../sequelize_setup");
const QuotationControllerV2 = require("../src/modules/procurement/infrastructure/api/QuotationControllerV2");
const EventBus = require('../src/shared/infrastructure/eventBus/EventBus');
const UpdateRfqStatusOnQuoteHandler = require('../src/modules/procurement/application/handlers/UpdateRfqStatusOnQuoteHandler');

jest.mock("../sequelize_setup", () => {
  const mTransaction = { commit: jest.fn(), rollback: jest.fn() };
  return {
    sequelize: { transaction: jest.fn().mockResolvedValue(mTransaction) },
    Quotation: { create: jest.fn(), update: jest.fn(), findByPk: jest.fn(), findAll: jest.fn() },
    QuotationItem: { bulkCreate: jest.fn() },
    PurchaseRequest: { findByPk: jest.fn(), update: jest.fn() },
    PurchaseRequestItem: { update: jest.fn() }
  };
});

describe("SPECIFICATION: EditQuotation (Supersede)", () => {
  let mockReq, mockRes;

  beforeAll(() => {
    EventBus.subscribe("QuotationSubmittedEvent", UpdateRfqStatusOnQuoteHandler);
  });

  beforeEach(() => {
    jest.clearAllMocks();

    mockReq = {
      user: { id: "seller-1", organization_id: "org-1" },
      params: { id: "quote-old" },
      body: {
        items: [
          {
            purchaseRequestItemId: "item-1",
            unitPrice: 90, // Price changed
            quantityOffered: 10,
            discount: 0,
            taxRate: 15
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

  it("should supersede old quote, create new one, and publish events", async () => {
    // 1. Arrange Mocks
    // Mock the old quote being loaded
    Quotation.findByPk.mockResolvedValue({
      id: "quote-old",
      purchaseRequestId: "req-123",
      sellerOrganizationId: "org-1",
      status: "submitted",
      items: [
        { id: "q-item-old", purchaseRequestItemId: "item-1", unitPrice: 100 }
      ]
    });

    // Mock RFQ being loaded
    PurchaseRequest.findByPk.mockResolvedValue({
      id: "req-123",
      status: "quoting",
      items: [
        { id: "item-1", quantity: 10, unit: "PCS", status: "quoted" }
      ]
    });

    // Mock newly created quote
    Quotation.create.mockResolvedValue({ id: "quote-new" });
    QuotationItem.bulkCreate.mockResolvedValue([{ id: "q-item-new" }]);

    // 2. Act
    await QuotationControllerV2.editQuotation(mockReq, mockRes);

    // 3. Assert Response
    expect(mockRes.status).toHaveBeenCalledWith(200);
    expect(mockRes.json).toHaveBeenCalledWith(expect.objectContaining({
      success: true,
      quote: expect.objectContaining({
        id: "quote-new",
        status: "submitted",
        subtotal: 900,
        taxAmount: 135, // 900 * 0.15
        grandTotal: 1035
      })
    }));

    // 4. Assert Persistence (Both handled in same transaction block)
    // Update old quote to superseded
    expect(Quotation.update).toHaveBeenCalledWith(
      expect.objectContaining({ status: "superseded" }),
      expect.objectContaining({ where: { id: "quote-old" }, transaction: expect.anything() })
    );

    // Create new quote
    expect(Quotation.create).toHaveBeenCalledWith(
      expect.objectContaining({
        purchaseRequestId: "req-123",
        status: "submitted",
        grandTotal: 1035
      }),
      expect.objectContaining({ transaction: expect.anything() })
    );

    // 5. Assert that EventBus was called to update RFQ status (since new quote is submitted)
    // We can wait slightly for the async handler to complete
    await new Promise(r => setTimeout(r, 50));
    
    // The handler should fetch the RFQ to update its items again
    expect(PurchaseRequest.findByPk).toHaveBeenCalledTimes(2); 
  });
});
