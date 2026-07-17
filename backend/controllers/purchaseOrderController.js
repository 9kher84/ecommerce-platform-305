const ProcurementService = require("../services/procurementService");
const catchAsync = require("../utils/catchAsync");

// @desc    Generate PO from an Award
// @route   POST /api/v2/purchase-orders/generate
// @access  Private (Buyer)
exports.generatePO = catchAsync(async (req, res, next) => {
  const { awardId } = req.body;
  if (!awardId) {
    return res.status(400).json({ success: false, message: "awardId is required." });
  }

  const po = await ProcurementService.generatePOFromAward(awardId, req.user.id);
  res.status(201).json({ success: true, message: "Purchase Order generated", data: po });
});

// @desc    Issue a Draft PO
// @route   POST /api/v2/purchase-orders/:id/issue
// @access  Private (Buyer)
exports.issuePO = catchAsync(async (req, res, next) => {
  const poId = req.params.id;
  const po = await ProcurementService.issuePurchaseOrder(poId, req.user.id);
  res.status(200).json({ success: true, message: "Purchase Order issued", data: po });
});

// @desc    Accept an Issued PO
// @route   POST /api/v2/purchase-orders/:id/accept
// @access  Private (Seller)
exports.acceptPO = catchAsync(async (req, res, next) => {
  const poId = req.params.id;
  const po = await ProcurementService.acceptPurchaseOrder(poId, req.user.id);
  res.status(200).json({ success: true, message: "Purchase Order accepted", data: po });
});

// @desc    Reject an Issued PO
// @route   POST /api/v2/purchase-orders/:id/reject
// @access  Private (Seller)
exports.rejectPO = catchAsync(async (req, res, next) => {
  const poId = req.params.id;
  const { reason } = req.body;
  const po = await ProcurementService.rejectPurchaseOrder(poId, req.user.id, reason);
  res.status(200).json({ success: true, message: "Purchase Order rejected", data: po });
});
