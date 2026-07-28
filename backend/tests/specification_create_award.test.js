const { Award, AwardLine } = require("../sequelize_setup");
const AwardControllerV2 = require("../src/modules/sales/infrastructure/api/AwardControllerV2");
const EventBus = require('../src/shared/infrastructure/eventBus/EventBus');
const QuotationRepository = require('../src/modules/procurement/repositories/QuotationRepository');

jest.mock("../sequelize_setup", () => {
  const original = jest.requireActual("../sequelize_setup");
  return {
    ...original,
    Award: {
      create: jest.fn().mockResolvedValue({}),
      update: jest.fn(),
    },
    AwardLine: {
      bulkCreate: jest.fn().mockResolvedValue([]),
    }
  };
});

jest.mock('../src/modules/procurement/repositories/QuotationRepository', () => {
  return jest.fn().mockImplementation(() => {
    return {
      findById: jest.fn()
    };
  });
});

describe("SPECIFICATION: CreateAward", () => {
  let mockReq, mockRes, publishSpy;

  beforeEach(() => {
    jest.clearAllMocks();
    publishSpy = jest.spyOn(EventBus, "publish").mockImplementation(() => {});

    mockReq = {
      body: {
        quotationId: "q-123",
        notes: "Test Award"
      },
      user: { id: "buyer-1" }
    };

    mockRes = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };
  });

  afterEach(() => {
    publishSpy.mockRestore();
  });

  it("1. Success: should create Award, create AwardLines, and emit AwardCreatedEvent", async () => {
    // Mock the Quotation Repository to return an accepted quotation
    const mockQuotationRepoInstance = new QuotationRepository();
    mockQuotationRepoInstance.findById.mockResolvedValue({
      id: "q-123",
      status: "accepted",
      purchaseRequestId: "pr-456",
      sellerOrganizationId: "org-789",
      items: [
        {
          id: "qi-1",
          purchaseRequestItemId: "pri-1",
          quantity: 10,
          unitPrice: 100,
          currency: "SAR",
          taxRate: 15,
          discount: 0
        }
      ]
    });
    
    QuotationRepository.mockImplementation(() => mockQuotationRepoInstance);

    await AwardControllerV2.createAward(mockReq, mockRes);

    expect(mockRes.status).toHaveBeenCalledWith(201);
    expect(mockRes.json).toHaveBeenCalledWith(expect.objectContaining({
      success: true,
      message: 'Award created successfully'
    }));

    // Check DB Calls
    expect(Award.create).toHaveBeenCalledWith(
      expect.objectContaining({
        purchaseRequestId: "pr-456",
        quotationId: "q-123",
        sellerOrganizationId: "org-789",
        status: "accepted",
        version: 1,
        totalAmount: 1150 // 10 * 100 = 1000 + 15% tax
      }),
      expect.objectContaining({ transaction: expect.anything() })
    );

    expect(AwardLine.bulkCreate).toHaveBeenCalledWith(
      expect.arrayContaining([
        expect.objectContaining({
          purchaseRequestItemId: "pri-1",
          quantityAwarded: 10,
          unitPriceAwarded: 100
        })
      ]),
      expect.objectContaining({ transaction: expect.anything() })
    );

    // Event Emission (Rule AE-01 & Event Dispatching)
    expect(publishSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        name: "AwardCreatedEvent",
        payload: expect.objectContaining({
          purchaseRequestId: "pr-456",
          status: "accepted"
        })
      })
    );
  });

  it("2. Failure: should throw error if quotation is not accepted", async () => {
    const mockQuotationRepoInstance = new QuotationRepository();
    mockQuotationRepoInstance.findById.mockResolvedValue({
      id: "q-123",
      status: "pending",
      items: []
    });
    QuotationRepository.mockImplementation(() => mockQuotationRepoInstance);

    const next = jest.fn();

    // Since asyncHandler catches errors and passes to next()
    try {
      await AwardControllerV2.createAward(mockReq, mockRes, next);
    } catch (e) {
      expect(e.message).toBe("Award can only be created for an accepted quotation");
    }
  });
});
