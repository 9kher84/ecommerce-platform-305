const catchAsync = require("../utils/catchAsync");
const FulfillmentService = require("../services/fulfillment/FulfillmentService");

// @desc    Start PO preparation
// @route   POST /api/v2/shipments/preparation
// @access  Private (Seller)
exports.startPreparation = catchAsync(async (req, res, next) => {
  const { poId } = req.body;
  if (!poId) {
    return res.status(400).json({ success: false, message: "poId is required" });
  }

  const po = await FulfillmentService.startPreparation(poId, req.user.id);
  res.status(200).json({ success: true, message: "PO preparation started", data: po });
});

// @desc    Mark PO ready to ship
// @route   POST /api/v2/shipments/preparation/:poId/ready
// @access  Private (Seller)
exports.markReadyToShip = catchAsync(async (req, res, next) => {
  const poId = req.params.poId || req.body.poId;
  if (!poId) {
    return res.status(400).json({ success: false, message: "poId is required" });
  }

  const po = await FulfillmentService.markReadyToShip(poId, req.user.id);
  res.status(200).json({ success: true, message: "PO marked ready to ship", data: po });
});

// @desc    Create a new Shipment for an accepted PO
// @route   POST /api/v2/shipments
// @access  Private (Seller)
exports.createShipment = catchAsync(async (req, res, next) => {
  const { poId, trackingNumber, carrier, lines } = req.body;
  if (!poId) {
    return res.status(400).json({ success: false, message: "poId is required" });
  }

  const sellerOrganizationId = req.user.organization_id || req.user.sellerOrganizationId;
  if (!sellerOrganizationId) {
    return res.status(400).json({
      success: false,
      message: "Seller Organization ID is missing. Organization setup is required to create shipments."
    });
  }

  const shipment = await FulfillmentService.createShipment(
    poId,
    sellerOrganizationId,
    req.user.id,
    { trackingNumber, carrier, lines: lines || [] }
  );

  res.status(201).json({ success: true, message: "Shipment created", data: shipment });
});

// @desc    Dispatch a Shipment (status -> in_transit)
// @route   POST /api/v2/shipments/:id/dispatch
// @access  Private (Seller)
exports.dispatchShipment = catchAsync(async (req, res, next) => {
  const shipmentId = req.params.id;
  const shipment = await FulfillmentService.dispatchShipment(shipmentId, req.user.id);
  res.status(200).json({ success: true, message: "Shipment dispatched", data: shipment });
});

// @desc    Get Fulfillment Summary Read Model for a Purchase Order
// @route   GET /api/v2/shipments/po/:poId/summary
// @access  Private (Seller)
exports.getFulfillmentSummary = catchAsync(async (req, res, next) => {
  const { poId } = req.params;
  const sellerOrganizationId = req.user?.organization_id || req.user?.sellerOrganizationId;

  if (!sellerOrganizationId) {
    return res.status(400).json({
      success: false,
      message: "Seller Organization ID missing. Organization setup is required to access fulfillment details."
    });
  }

  const summary = await FulfillmentService.getFulfillmentSummary(poId, sellerOrganizationId);
  res.status(200).json({ success: true, data: summary });
});
