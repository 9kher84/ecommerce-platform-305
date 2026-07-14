const asyncHandler = require("express-async-handler");
const QuotationService = require("../services/quotationService");

// @desc    Submit a new quotation
// @route   POST /api/v1/rfqs/:id/quotes
// @access  Private (Seller)
const submitQuotation = asyncHandler(async (req, res) => {
  const requestId = req.params.id;
  const sellerOrgId = req.user.organization_id;
  const actorId = req.user.id;

  if (!sellerOrgId) {
    res.status(403);
    throw new Error("You must belong to a seller organization to submit a quote.");
  }

  const quote = await QuotationService.submitQuotation(requestId, sellerOrgId, req.body, actorId);

  res.status(201).json({
    success: true,
    message: "Quotation submitted successfully",
    quote
  });
});

// @desc    Edit/Supersede an existing quotation
// @route   PUT /api/v1/quotes/:id
// @access  Private (Seller)
const editQuotation = asyncHandler(async (req, res) => {
  const quotationId = req.params.id;
  const sellerOrgId = req.user.organization_id;
  const actorId = req.user.id;

  const quote = await QuotationService.editQuotation(quotationId, sellerOrgId, req.body, actorId);

  res.status(200).json({
    success: true,
    message: "Quotation updated successfully",
    quote
  });
});

// @desc    Withdraw a quotation
// @route   PATCH /api/v1/quotes/:id/withdraw
// @access  Private (Seller)
const withdrawQuotation = asyncHandler(async (req, res) => {
  const quotationId = req.params.id;
  const sellerOrgId = req.user.organization_id;

  const quote = await QuotationService.withdrawQuotation(quotationId, sellerOrgId);

  res.status(200).json({
    success: true,
    message: "Quotation withdrawn successfully",
    quote
  });
});

// @desc    Request negotiation on a quotation
// @route   POST /api/v1/quotes/:id/negotiate
// @access  Private (Buyer)
const negotiateQuotation = asyncHandler(async (req, res) => {
  const quotationId = req.params.id;
  const buyerId = req.user.id;

  const result = await QuotationService.requestNegotiation(quotationId, buyerId, req.body);

  res.status(200).json(result);
});

module.exports = {
  submitQuotation,
  editQuotation,
  withdrawQuotation,
  negotiateQuotation
};
