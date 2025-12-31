const QuoteService = require('../services/quoteService');
const asyncHandler = require('express-async-handler');

/**
 * @desc    Submit a price quote to a purchase request
 * @route   POST /api/quotes
 * @access  Private (Seller only)
 */
exports.submitQuote = asyncHandler(async (req, res) => {
    const sellerId = req.user.id;

    const quote = await QuoteService.submitQuote(sellerId, req.body);

    res.status(201).json({
        success: true,
        message: 'Price quote submitted successfully',
        quote
    });
});

/**
 * @desc    Get quotes for a purchase request
 * @route   GET /api/quotes/request/:requestId
 * @access  Private (Buyer - owner only, or Admin)
 */
exports.getQuotesForRequest = asyncHandler(async (req, res) => {
    const user = req.user;
    const request = req.resource; // Loaded by Middleware (PurchaseRequest)
    // If not loaded (fallback safety), we might lack data for flags.
    // Middleware ensures it's there.

    // View Logic (Controller Duty)
    const isOwner = user.id === request.userId;
    const isAdmin = ['admin', 'super_admin', 'city_manager'].includes(user.role);
    const isSeller = user.role === 'seller';

    const options = {
        onlyOwnQuotes: false,
        maskCompetitors: false
    };

    if (!isOwner && !isAdmin) {
        if (isSeller) {
            if (request.auction_type === 'secret') {
                options.onlyOwnQuotes = true;
            } else {
                options.maskCompetitors = true;
            }
        }
    }

    const quotes = await QuoteService.getSafeQuotes(request.id, user.id, options);

    res.status(200).json({
        success: true,
        count: quotes.length,
        quotes
    });
});

/**
 * @desc    Get seller's submitted quotes
 * @route   GET /api/quotes/my-quotes
 * @access  Private (Seller)
 */
exports.getMyQuotes = asyncHandler(async (req, res) => {
    const sellerId = req.user.id;
    const filters = {
        status: req.query.status
    };

    const quotes = await QuoteService.getSellerQuotes(sellerId, filters);

    res.status(200).json({
        success: true,
        count: quotes.length,
        quotes
    });
});

/**
 * @desc    Buyer negotiates (counter-offer)
 * @route   POST /api/quotes/:id/negotiate
 * @access  Private (Buyer - owner only)
 */
exports.negotiate = asyncHandler(async (req, res) => {
    const quoteId = req.params.id;
    const buyerId = req.user.id;
    const { price, date } = req.body;

    const quote = await QuoteService.negotiate(quoteId, buyerId, { price, date });

    res.status(200).json({
        success: true,
        message: 'Counter-offer sent to seller',
        quote
    });
});

/**
 * @desc    Seller responds to negotiation
 * @route   POST /api/quotes/:id/respond
 * @access  Private (Seller - owner only)
 */
exports.respondToNegotiation = asyncHandler(async (req, res) => {
    const quoteId = req.params.id;
    const sellerId = req.user.id;
    const { accept, newPrice } = req.body;

    const quote = await QuoteService.respondToNegotiation(quoteId, sellerId, { accept, newPrice });

    res.status(200).json({
        success: true,
        message: accept ? 'Counter-offer accepted' : 'Counter-offer rejected',
        quote
    });
});

/**
 * @desc    Accept a quote (creates deal)
 * @route   POST /api/quotes/:id/accept
 * @access  Private (Buyer - owner only)
 */
exports.acceptQuote = asyncHandler(async (req, res) => {
    const quoteId = req.params.id;
    const buyerId = req.user.id;

    const deal = await QuoteService.acceptQuote(quoteId, buyerId);

    res.status(201).json({
        success: true,
        message: 'Quote accepted! Deal created successfully.',
        deal
    });
});

/**
 * @desc    Reject a quote
 * @route   POST /api/quotes/:id/reject
 * @access  Private (Buyer - owner only)
 */
exports.rejectQuote = asyncHandler(async (req, res) => {
    const quoteId = req.params.id;
    const buyerId = req.user.id;
    const { reason } = req.body;

    const quote = await QuoteService.rejectQuote(quoteId, buyerId, reason);

    res.status(200).json({
        success: true,
        message: 'Quote rejected',
        quote
    });
});

/**
 * @desc    Withdraw a quote
 * @route   POST /api/quotes/:id/withdraw
 * @access  Private (Seller - owner only)
 */
exports.withdrawQuote = asyncHandler(async (req, res) => {
    const quoteId = req.params.id;
    const sellerId = req.user.id;
    const { reason } = req.body;

    const quote = await QuoteService.withdrawQuote(quoteId, sellerId, reason);

    res.status(200).json({
        success: true,
        message: 'Quote withdrawn. Penalty applied based on your subscription tier.',
        quote
    });
});

/**
 * @desc    Modify quote after rejection (Plan B only)
 * @route   PUT /api/quotes/:id/modify
 * @access  Private (Seller - owner only, Plan B)
 */
exports.modifyAfterRejection = asyncHandler(async (req, res) => {
    const quoteId = req.params.id;
    const sellerId = req.user.id;

    const modifiedQuote = await QuoteService.modifyAfterRejection(quoteId, sellerId, req.body);

    res.status(201).json({
        success: true,
        message: 'Modified quote submitted successfully',
        quote: modifiedQuote
    });
});
