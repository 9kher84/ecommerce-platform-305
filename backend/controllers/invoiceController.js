const { Deal, PurchaseRequest } = require("../sequelize_setup");
const asyncHandler = require("express-async-handler");
const AppError = require("../utils/appError");

/**
 * 🛡️ Sovereign Invoice Controller
 */
exports.extractText = asyncHandler(async (req, res) => {
  const { id, text, type } = req.body; // type: 'deal' or 'request'

  if (!id || !text) {
    throw new AppError("ID and text are required", 400);
  }

  let model;
  if (type === "deal") model = Deal;
  else if (type === "request") model = PurchaseRequest;
  else throw new AppError("Invalid type", 400);

  const record = await model.findByPk(id);
  if (!record) throw new AppError("Record not found", 404);

  // Encrypt is handled by model setter
  await record.update({ invoiceText: text });

  res.status(200).json({
    success: true,
    message: "Invoice text stored securely (Encrypted at Rest).",
  });
});

const BillingService = require("../services/billing/BillingService");

/**
 * 🛡️ Get Invoice Eligibility for a Purchase Order
 * @route GET /api/invoice/eligibility/:poId
 * @access Private
 */
exports.getPOInvoiceEligibility = asyncHandler(async (req, res) => {
  const { poId } = req.params;
  if (!poId) {
    throw new AppError("Purchase Order ID is required", 400);
  }

  const eligibility = await BillingService.getInvoiceEligibility(poId);
  res.status(200).json({
    success: true,
    data: eligibility,
  });
});

/**
 * 🛡️ Issue Commercial Invoice from a Purchase Order
 * @route POST /api/invoice/issue
 * @access Private (Seller)
 */
exports.issuePOInvoice = asyncHandler(async (req, res) => {
  const { purchaseOrderId, lines } = req.body;

  if (!purchaseOrderId || !Array.isArray(lines) || lines.length === 0) {
    throw new AppError("purchaseOrderId and lines array are required", 400);
  }

  const invoice = await BillingService.issueInvoiceFromPO(
    purchaseOrderId,
    lines,
    req.user.id
  );

  res.status(201).json({
    success: true,
    message: "Commercial Invoice issued successfully",
    data: invoice,
  });
});
