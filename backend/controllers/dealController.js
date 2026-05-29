const {
  Deal,
  PurchaseRequest,
  User,
  PriceQuote,
} = require("../sequelize_setup");
const asyncHandler = require("express-async-handler");
const AppError = require("../utils/appError");
const { Op } = require("sequelize");

/**
 * @desc    Get all deals for the user (Buyer or Seller)
 * @route   GET /api/deals
 * @access  Private
 */
exports.getDeals = asyncHandler(async (req, res) => {
  const userId = req.user.id;
  const { status } = req.query;

  const where = {
    [Op.or]: [{ sellerId: userId }, { buyerId: userId }],
  };

  if (status) where.status = status;

  const deals = await Deal.findAll({
    where,
    include: [
      {
        model: PurchaseRequest,
        as: "purchaseRequest",
        attributes: ["id", "title"],
      },
      { model: User, as: "seller", attributes: ["id", "name", "businessName"] },
      { model: User, as: "buyer", attributes: ["id", "name"] },
    ],
    order: [["createdAt", "DESC"]],
  });

  res.status(200).json({
    success: true,
    count: deals.length,
    deals,
  });
});

/**
 * @desc    Get specific deal with REVEALED CONTACTS
 * @route   GET /api/deals/:id
 * @access  Private (Involved parties only)
 */
exports.getDealById = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const userId = req.user.id;

  const deal = await Deal.findByPk(id, {
    include: [
      { model: PurchaseRequest, as: "purchaseRequest" },
      {
        model: User,
        as: "seller",
        attributes: ["id", "name", "businessName", "mobile", "email"],
      },
      {
        model: User,
        as: "buyer",
        attributes: ["id", "name", "mobile", "email"],
      },
      { model: PriceQuote, as: "priceQuote" },
    ],
  });

  if (!deal) throw new AppError("Deal not found", 404);

  // Security Check: Only involved parties or admin/owner
  const isSeller = deal.sellerId === userId;
  const isBuyer = deal.buyerId === userId;
  const isAdmin = ["admin", "super_admin"].includes(req.user.role);

  if (!isSeller && !isBuyer && !isAdmin) {
    throw new AppError("Unauthorized access to deal details", 403);
  }

  res.status(200).json({
    success: true,
    deal,
  });
});

/**
 * @desc    Update deal status
 * @route   PATCH /api/deals/:id/status
 * @access  Private
 */
exports.updateDealStatus = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { status, notes } = req.body;
  const userId = req.user.id;

  const deal = await Deal.findByPk(id);
  if (!deal) throw new AppError("Deal not found", 404);

  // Basic permission check
  if (
    deal.sellerId !== userId &&
    deal.buyerId !== userId &&
    !["admin", "super_admin"].includes(req.user.role)
  ) {
    throw new AppError("Unauthorized", 403);
  }

  deal.status = status;
  if (notes) deal.notes = notes;
  await deal.save();

  res.status(200).json({
    success: true,
    message: "Deal status updated",
    deal,
  });
});
