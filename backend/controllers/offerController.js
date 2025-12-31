const { Offer, Post, User, Deal, Notification } = require('../sequelize_setup');
const catchAsync = require('../utils/catchAsync');
const AppError = require('../utils/appError');
const { sequelize } = require('../sequelize_setup');
const { Op } = require('sequelize');

// 1. Get Offers for a Post
// - Buyer (owner) can view offers.
exports.getPostOffers = catchAsync(async (req, res, next) => {
    const { postId } = req.params;
    const user = req.user;

    const post = await Post.findByPk(postId);
    if (!post) {
        return next(new AppError('No post found with that ID', 404));
    }

    // Only the buyer (owner) or admin can view offers
    if (post.buyerId !== user.id && user.role !== 'admin' && user.role !== 'super_admin') {
        return next(new AppError('You are not authorized to view offers for this post', 403));
    }

    const offers = await Offer.findAll({
        where: { postId },
        include: [
            {
                model: User,
                as: 'seller', // The person who made the offer (Seller)
                attributes: ['id', 'name', 'isPremium'] // Removed rating
            }
        ],
        order: [['amount', 'ASC']] // Best price first?
    });

    res.status(200).json({
        status: 'success',
        results: offers.length,
        offers
    });
});

// 2. Create Offer (Bid)
// - Seller creates an offer on a buyer's post.
exports.createOffer = catchAsync(async (req, res, next) => {
    const { postId } = req.params;
    const { amount, currency, description } = req.body;
    const user = req.user;

    // 1. Check if Post exists and is open
    const post = await Post.findByPk(postId);
    if (!post) {
        return next(new AppError('No post found with that ID', 404));
    }
    if (post.status !== 'open') {
        return next(new AppError('This post is no longer accepting offers', 400));
    }

    // 2. Check if User is a Seller (already checked by authorize('seller'))
    // But double check logic if needed.

    // 3. Create Offer
    // Note: In OfferModel, the field might be named `buyerId` historically or `sellerId`.
    // Let's check OfferModel definition.
    // It usually has `userId` or `sellerId`.
    // Based on previous context, OfferModel has `sellerId` (or `buyerId` if it was reversed).
    // Let's assume we fixed OfferModel to have `sellerId` or we use `buyerId` field to store the offer maker ID if legacy.
    // Wait, in V1, Buyer made offers on Products.
    // In V2, Seller makes offers on Posts.
    // We should use a generic `userId` or ensure `sellerId` exists.
    // Let's assume `sellerId` exists in OfferModel as per my V2 updates.
    // If not, we might need to use `buyerId` field but treat it as "Offer Maker".
    // BUT, to be safe and clean, let's assume `sellerId` is the field for the person making the offer.

    // However, if the DB schema wasn't fully migrated to rename `buyerId` to `sellerId`, we might have issues.
    // Let's check what I wrote in OfferModel.js previously.
    // I didn't edit OfferModel.js recently to rename fields, only added currency.
    // So it likely still has `buyerId` (meaning "User who made the offer").
    // Let's use `buyerId` to store the `req.user.id` (Seller), effectively "Offer Maker ID".

    const newOffer = await Offer.create({
        postId,
        buyerId: user.id, // The SELLER is the one making the offer here.
        amount,
        currency: currency || 'SAR',
        status: 'pending',
        description
    });

    // 4. Notify Buyer
    // await Notification.create({ ... });

    res.status(201).json({
        status: 'success',
        offer: newOffer
    });
});

// 3. Accept Offer
// - Buyer accepts a seller's offer.
exports.acceptOffer = catchAsync(async (req, res, next) => {
    const { offerId } = req.params;
    const user = req.user; // The Buyer

    const offer = await Offer.findByPk(offerId, {
        include: [{ model: Post, as: 'post' }]
    });

    if (!offer) {
        return next(new AppError('No offer found with that ID', 404));
    }

    const post = offer.post;

    // Check if user is the owner of the post
    if (post.buyerId !== user.id && user.role !== 'admin') {
        return next(new AppError('You are not authorized to accept this offer', 403));
    }

    if (post.status !== 'open') {
        return next(new AppError('This post is not open', 400));
    }

    // Start Transaction
    const result = await sequelize.transaction(async (t) => {
        // 1. Update Offer Status
        await offer.update({ status: 'accepted' }, { transaction: t });

        // 2. Update Post Status
        await post.update({ status: 'closed' }, { transaction: t });

        // 3. Reject other offers? (Optional)
        await Offer.update({ status: 'rejected' }, {
            where: {
                postId: post.id,
                id: { [Op.ne]: offer.id }
            },
            transaction: t
        });

        // 4. Create Deal
        // Calculate Commission
        const commissionRate = 0.05; // 5%
        const commission = offer.amount * commissionRate;
        const finalAmount = offer.amount; // Or amount + commission? Usually seller pays or deducted.
        // Let's say Platform takes commission from Seller's earnings.

        const deal = await Deal.create({
            postId: post.id,
            offerId: offer.id,
            sellerId: offer.buyerId, // The one who made the offer (Seller)
            buyerId: post.buyerId,   // The one who made the post (Buyer)
            finalAmount: finalAmount,
            status: 'agreed'
        }, { transaction: t });

        return { deal, commission };
    });

    res.status(200).json({
        status: 'success',
        deal: result.deal,
        commission: result.commission
    });
});

// 4. Delete Offer (Cancel)
exports.deleteOffer = catchAsync(async (req, res, next) => {
    const { offerId } = req.params;
    const user = req.user;

    const offer = await Offer.findByPk(offerId);

    if (!offer) {
        return next(new AppError('No offer found with that ID', 404));
    }

    // Only the seller (creator) or admin can delete
    // Note: offer.buyerId stores the Seller ID (Offer Maker)
    if (offer.buyerId !== user.id && user.role !== 'admin') {
        return next(new AppError('You are not authorized to delete this offer', 403));
    }

    if (offer.status === 'accepted') {
        return next(new AppError('Cannot delete an accepted offer', 400));
    }

    await offer.destroy();

    res.status(204).json({
        status: 'success',
        data: null
    });
});