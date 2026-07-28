const asyncHandler = require("express-async-handler");
const SubmitQuotationUseCase = require("../../application/use-cases/SubmitQuotationUseCase");
const QuotationRepository = require("../../repositories/QuotationRepository");
const PurchaseRequestRepository = require("../../repositories/PurchaseRequestRepository");
const TransactionManager = require("../../../../shared/application/TransactionManager");

const EditQuotationUseCase = require("../../application/use-cases/EditQuotationUseCase");
const WithdrawQuotationUseCase = require("../../application/use-cases/WithdrawQuotationUseCase");
const NegotiateQuotationUseCase = require("../../application/use-cases/NegotiateQuotationUseCase");

// Dependency Injection
const quotationRepo = new QuotationRepository();
const purchaseRequestRepo = new PurchaseRequestRepository();
const transactionManager = new TransactionManager();
const submitQuotationUseCase = new SubmitQuotationUseCase({ quotationRepo, purchaseRequestRepo, transactionManager });
const editQuotationUseCase = new EditQuotationUseCase({ quotationRepo, purchaseRequestRepo, transactionManager });
const withdrawQuotationUseCase = new WithdrawQuotationUseCase({ quotationRepo, transactionManager });
const negotiateQuotationUseCase = new NegotiateQuotationUseCase({ quotationRepo, transactionManager });

class QuotationControllerV2 {
  
  // @desc    Submit a new quotation (Golden Template v1.0)
  // @route   POST /api/v2/rfqs/:id/quotes
  // @access  Private (Seller)
  static submitQuotation = asyncHandler(async (req, res) => {
    const purchaseRequestId = req.params.id;
    const sellerOrganizationId = req.user.organization_id;
    const actorId = req.user.id;
    const items = req.body.items || [];

    if (!sellerOrganizationId) {
      res.status(403);
      throw new Error("You must belong to a seller organization to submit a quote.");
    }

    const command = {
      purchaseRequestId,
      sellerOrganizationId,
      items
    };

    const context = {
      actorId,
      ipAddress: req.ip || req.connection.remoteAddress,
      userAgent: req.headers["user-agent"]
    };

    const newQuotation = await submitQuotationUseCase.execute(command, context);

    res.status(201).json({
      success: true,
      message: "Quotation submitted successfully",
      quote: newQuotation
    });
  });

  // @desc    Edit/Supersede an existing quotation
  // @route   PUT /api/v2/quotes/:id
  // @access  Private (Seller)
  static editQuotation = asyncHandler(async (req, res) => {
    const quotationId = req.params.id;
    const sellerOrganizationId = req.user.organization_id;
    const actorId = req.user.id;
    const newItems = req.body.items || [];

    if (!sellerOrganizationId) {
      res.status(403);
      throw new Error("You must belong to a seller organization to edit a quote.");
    }

    const command = {
      quotationId,
      newItems
    };

    const context = {
      actorId,
      sellerOrganizationId,
      ipAddress: req.ip || req.connection?.remoteAddress,
      userAgent: req.headers["user-agent"]
    };

    const newQuotation = await editQuotationUseCase.execute(command, context);

    res.status(200).json({
      success: true,
      message: "Quotation updated successfully",
      quote: newQuotation
    });
  });

  // @desc    Withdraw an existing quotation
  // @route   PUT /api/v2/quotes/:id/withdraw
  // @access  Private (Seller)
  static withdrawQuotation = asyncHandler(async (req, res) => {
    const quotationId = req.params.id;
    const sellerOrganizationId = req.user.organization_id;

    if (!sellerOrganizationId) {
      res.status(403);
      throw new Error("You must belong to a seller organization to withdraw a quote.");
    }

    const command = {
      quotationId,
      sellerOrganizationId,
      timestamp: new Date()
    };

    const updatedQuotation = await withdrawQuotationUseCase.execute(command);

    res.status(200).json({
      success: true,
      message: "Quotation withdrawn successfully",
      quote: updatedQuotation
    });
  });

  // @desc    Negotiate a quotation (Buyer counter-offer)
  // @route   POST /api/v2/quotes/:id/negotiate
  // @access  Private (Buyer)
  static negotiateQuotation = asyncHandler(async (req, res) => {
    const quotationId = req.params.id;
    const actorId = req.user.id;
    const buyerOrganizationId = req.user.organization_id;
    const counterOfferItems = req.body.items || [];

    if (!buyerOrganizationId) {
      res.status(403);
      throw new Error("You must belong to a buyer organization to negotiate a quote.");
    }

    const command = {
      quotationId,
      counterOfferItems,
      timestamp: new Date()
    };

    const context = {
      actorId,
      buyerOrganizationId,
      ipAddress: req.ip || req.connection?.remoteAddress,
      userAgent: req.headers["user-agent"]
    };

    // ConcurrencyException will be thrown if Optimistic Lock fails
    const negotiatedQuotation = await negotiateQuotationUseCase.execute(command, context);

    res.status(200).json({
      success: true,
      message: "Negotiation offer submitted successfully",
      quote: negotiatedQuotation
    });
  });
}

module.exports = QuotationControllerV2;
