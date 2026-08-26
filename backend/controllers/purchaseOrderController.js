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

  try {
    // IDOR / Authorization Check: Verify requesting user owns the Award's PurchaseRequest or matches buyerOrg
    const { Award, PurchaseRequest, OrganizationUser } = require("../sequelize_setup");
    const award = await Award.findByPk(awardId, {
      include: [{ model: PurchaseRequest, as: "request" }]
    });

    if (!award) {
      return res.status(404).json({ success: false, message: `Award not found: ${awardId}` });
    }

    const requestingUserId = req.user.id;
    let isAuthorized = false;

    if (award.request && award.request.userId === requestingUserId) {
      isAuthorized = true;
    } else if (award.buyerOrganizationId) {
      const userOrg = await OrganizationUser.findOne({
        where: { user_id: requestingUserId, organization_id: award.buyerOrganizationId }
      });
      if (userOrg) isAuthorized = true;
    }

    if (!isAuthorized) {
      return res.status(403).json({
        success: false,
        message: "Forbidden: You do not have authorization to generate a Purchase Order for this Award."
      });
    }

    const po = await ProcurementService.generatePOFromAward(awardId);
    res.status(201).json({ success: true, message: "Purchase Order generated", data: po });
  } catch (error) {
    console.error("=== GENERATE PO ERROR DIAGNOSTIC ===", {
      awardId,
      userId: req.user ? req.user.id : null,
      errorName: error.name,
      errorMessage: error.message,
      parentError: error.parent ? error.parent.message : null,
      parentDetail: error.parent ? error.parent.detail : null,
      parentConstraint: error.parent ? error.parent.constraint : null,
      parentCode: error.parent ? error.parent.code : null,
      originalError: error.original ? error.original.message : null,
      sql: error.sql || null
    });
    const isKnownDomainError = typeof error.statusCode === "number" && error.statusCode >= 400 && error.statusCode < 500;
    const responseStatusCode = isKnownDomainError ? error.statusCode : 500;
    const responseMessage = isKnownDomainError ? error.message : "An unexpected error occurred while generating the Purchase Order.";

    return res.status(responseStatusCode).json({
      success: false,
      code: "PURCHASE_ORDER_GENERATION_FAILED",
      message: responseMessage
    });
  }
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

// @desc    Get Seller POs
// @route   GET /api/v2/purchase-orders/seller
// @access  Private (Seller)
exports.getSellerPOs = catchAsync(async (req, res, next) => {
  let sellerOrgId = req.user?.organization_id || req.user?.organizationId;

  if (!sellerOrgId && req.user?.id) {
    const { OrganizationUser } = require("../sequelize_setup");
    const activeMember = await OrganizationUser.findOne({
      where: { user_id: req.user.id, status: "active" },
      order: [["is_primary", "DESC"], ["createdAt", "ASC"]]
    });
    sellerOrgId = activeMember?.organization_id || null;
  }

  if (!sellerOrgId) {
    return res.status(422).json({
      success: false,
      errorCode: "ORGANIZATION_CONTEXT_REQUIRED",
      message: "ORGANIZATION_CONTEXT_REQUIRED: Seller organization identification missing. Please complete organization setup or provide valid organization context.",
      data: []
    });
  }

  const pos = await ProcurementService.getSellerPurchaseOrders(sellerOrgId);
  res.status(200).json({ success: true, count: pos.length, data: pos });
});
