// adminStats addition
exports.getAdminStats = asyncHandler(async (req, res) => {
  const [
    totalUsers,
    activeUsers,
    totalBuyers,
    totalSellers,
    publishedRFQs,
    draftRFQs,
    totalQuotes,
    activeDeals,
    closedDeals
  ] = await Promise.all([
    User.count({ where: { role: { [Op.in]: ['buyer', 'seller'] } } }),
    User.count({ where: { isActive: true, role: { [Op.in]: ['buyer', 'seller'] } } }), // Adjusting to exclude admins if wanted, but fine to just include all active users.
    User.count({ where: { role: 'buyer' } }),
    User.count({ where: { role: 'seller' } }),
    PurchaseRequest.count({ where: { status: 'published' } }),
    PurchaseRequest.count({ where: { status: 'draft' } }),
    PriceQuote.count(),
    Deal.count({ where: { status: { [Op.in]: ['active', 'pending'] } } }),
    Deal.count({ where: { status: 'completed' } })
  ]);

  res.status(200).json({
    success: true,
    data: {
      totalUsers,
      activeUsers,
      totalBuyers,
      totalSellers,
      publishedRFQs,
      draftRFQs,
      totalQuotes,
      activeDeals,
      closedDeals
    }
  });
});
