const catchAsync = require("../utils/catchAsync");
const FulfillmentService = require("../services/fulfillment/FulfillmentService");
const { PurchaseOrder, Award, Receipt } = require("../sequelize_setup");

// @desc    Get Receipt Summary Read Model for a Purchase Order
// @route   GET /api/v2/receipts/po/:poId/summary
// @access  Private (Buyer)
exports.getReceiptSummary = catchAsync(async (req, res, next) => {
  const { poId } = req.params;
  const buyerOrganizationId = req.user?.organization_id || req.user?.buyerOrganizationId;

  if (!buyerOrganizationId) {
    return res.status(400).json({
      success: false,
      message: "Buyer Organization ID missing. Organization setup is required to access receipt details."
    });
  }

  const summary = await FulfillmentService.getReceiptSummary(poId, buyerOrganizationId);
  res.status(200).json({ success: true, data: summary });
});

// @desc    Log physical goods receipt against a dispatched shipment
// @route   POST /api/v2/receipts
// @access  Private (Buyer)
exports.logReceipt = catchAsync(async (req, res, next) => {
  const { poId, shipmentId, lines } = req.body;

  if (!poId) {
    return res.status(400).json({ success: false, message: "poId is required" });
  }

  if (!shipmentId) {
    return res.status(400).json({ success: false, message: "shipmentId is required. Receipt must be bound to a dispatched shipment." });
  }

  if (!lines || !Array.isArray(lines) || lines.length === 0) {
    return res.status(400).json({ success: false, message: "lines array with item quantities is required" });
  }

  const buyerOrganizationId = req.user?.organization_id || req.user?.buyerOrganizationId;

  // IDOR & Authorization check: verify PO belongs to buyer's organization
  const po = await PurchaseOrder.findByPk(poId, {
    include: [{ model: Award, as: "award" }]
  });

  if (!po) {
    return res.status(404).json({ success: false, message: "Purchase Order not found" });
  }

  if (buyerOrganizationId && po.award && po.award.buyerOrganizationId !== buyerOrganizationId) {
    return res.status(403).json({
      success: false,
      message: "Forbidden: You do not have authorization to log a receipt for this Purchase Order."
    });
  }

  const receipt = await FulfillmentService.logReceipt(poId, req.user.id, { shipmentId, lines });
  res.status(201).json({ success: true, message: "Receipt logged", data: receipt });
});

// @desc    Accept/complete inspection of a Receipt
// @route   POST /api/v2/receipts/:receiptId/accept
// @access  Private (Buyer)
exports.acceptReceipt = catchAsync(async (req, res, next) => {
  const { receiptId } = req.params;

  if (!receiptId) {
    return res.status(400).json({ success: false, message: "receiptId is required" });
  }

  const buyerOrganizationId = req.user?.organization_id || req.user?.buyerOrganizationId;

  // IDOR & Authorization check: verify Receipt -> PO -> Award ownership
  const receipt = await Receipt.findByPk(receiptId, {
    include: [{
      model: PurchaseOrder,
      as: "purchaseOrder",
      include: [{ model: Award, as: "award" }]
    }]
  });

  if (!receipt) {
    return res.status(404).json({ success: false, message: "Receipt not found" });
  }

  if (buyerOrganizationId && receipt.purchaseOrder && receipt.purchaseOrder.award && receipt.purchaseOrder.award.buyerOrganizationId !== buyerOrganizationId) {
    return res.status(403).json({
      success: false,
      message: "Forbidden: You do not have authorization to accept this Receipt."
    });
  }

  const acceptedReceipt = await FulfillmentService.acceptReceipt(receiptId, req.user.id);
  res.status(200).json({ success: true, message: "Receipt accepted", data: acceptedReceipt });
});
