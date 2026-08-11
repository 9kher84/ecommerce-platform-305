const PublishPurchaseRequestDTO = require('../../application/dto/PublishPurchaseRequestDTO');
const PublishPurchaseRequestUseCase = require("../../application/use-cases/PublishPurchaseRequestUseCase");
const CreatePurchaseRequestUseCase = require("../../application/use-cases/CreatePurchaseRequestUseCase");
const PurchaseRequestRepository = require('../../repositories/PurchaseRequestRepository');
const UnitOfWork = require("../../../../shared/application/UnitOfWork");
const OutboxRepository = require("../../../../shared/infrastructure/outbox/OutboxRepository");
const asyncHandler = require("express-async-handler");
const { sequelize } = require("../../../../../sequelize_setup");

const TransactionManager = require('../../../../shared/application/TransactionManager');

// Dependency Injection
const requestRepo = new PurchaseRequestRepository();
const outboxRepo = new OutboxRepository(null, sequelize);
const transactionManager = new TransactionManager(sequelize);
const unitOfWork = new UnitOfWork({ transactionManager, outboxRepo });
const publishUseCase = new PublishPurchaseRequestUseCase({ requestRepo, unitOfWork });
const createUseCase = new CreatePurchaseRequestUseCase({ requestRepo, unitOfWork });

/**
 * ADAPTER: Controller (Wave 1 & 2B)
 * Completely isolated from ORM and Business Logic.
 * Responsible ONLY for mapping HTTP Request -> DTO -> UseCase -> HTTP Response.
 */
class RequestControllerV2 {
  constructor() {
    this.publishUseCase = publishUseCase;
    this.createUseCase = createUseCase;

    // Bind context to preserve 'this'
    this.publishRequest = this.publishRequest.bind(this);
    this.createRequest = this.createRequest.bind(this);
  }

  createRequest = asyncHandler(async (req, res) => {
    const headerData = req.body.header || { title: req.body.title, sectorId: req.body.sectorId || "construction" };
    
    // Map tender_type (PUBLIC/PRIVATE) to auction_type (public/secret)
    if (headerData.tender_type === "PRIVATE") {
      headerData.auction_type = "secret";
    } else {
      headerData.auction_type = "public";
    }

    const dto = {
      header: headerData,
      items: req.body.items,
      invitations: req.body.invitations,
      actorId: req.user.id,
      actorRole: req.user.role,
    };

    const request = await this.createUseCase.execute(dto);

    res.status(201).json({
      success: true,
      message: "Purchase request created successfully as draft.",
      request,
    });
  });

  // Wrapped with asyncHandler to mimic existing Express error handling
  publishRequest = asyncHandler(async (req, res) => {
    const dto = new PublishPurchaseRequestDTO({
      requestId: req.params.id,
      publishAsRFQ: req.body.publishAsRFQ,
      actorId: req.user.id,
      actorRole: req.user.role,
      ipAddress: req.ip || req.connection?.remoteAddress,
      userAgent: req.headers['user-agent']
    });

    const request = await this.publishUseCase.execute(dto);
    const targetStatus = dto.publishAsRFQ ? "rfq_published" : "published";

    res.status(200).json({
      success: true,
      message: `Request published successfully as ${targetStatus}. Sellers will be notified.`,
      request,
    });
  });
}

module.exports = new RequestControllerV2();
