const { PriceQuote, PurchaseRequest, User, Deal } = require('../sequelize_setup');
const SubscriptionService = require('./subscriptionService');
const SmartPricingService = require('./smartPricingService');
const WithdrawalLog = require('../models/WithdrawalLog');
const RequestService = require('./requestService'); // Import RequestService
const NotificationService = require('./notificationService'); // Import NotificationService for Phase 2.1
const { Op } = require('sequelize');

/**
 * QuoteService
 * 
 * Manages price quotes (sellers submitting quotes to buyer requests)
 */
class QuoteService {

    /**
     * Submit a price quote to a purchase request
     * @param {string} sellerId - User UUID
     * @param {Object} quoteData - Quote details
     * @returns {Promise<PriceQuote>}
     */
    /**
     * Submit a price quote (Auth checks removed, handled by Policy)
     */
    static async submitQuote(sellerId, quoteData) {
        // Validation of existence
        const seller = await User.findByPk(sellerId);
        if (!seller) throw new Error('User not found');

        // Removed: role check (Policy/RBAC handles it)

        // Get the purchase request
        const request = await PurchaseRequest.findByPk(quoteData.purchaseRequestId);
        if (!request) throw new Error('Purchase request not found');

        // ... (Rest of logic: canReceiveQuotes, targetSellerId, SmartPricing)
        // ...

        // Validation continues...
        if (!request.canReceiveQuotes()) {
            throw new Error('This request is not accepting quotes (expired or not published)');
        }

        // Check direct purchase restriction
        if (request.post_type === 'direct' && request.targetSellerId) {
            if (request.targetSellerId !== sellerId) {
                throw new Error('هذا الطلب مخصص للشراء المباشر من بائع محدد فقط');
            }
        }

        // ... (Fixed Price & Smart Pricing logic remains the same)

        // ====================================================================
        // COMMAND 6: FIXED PRICE VALIDATION (Plan B Buyer Exclusive)
        // ====================================================================
        if (request.fixed_price && parseFloat(request.fixed_price) > 0) {
            const quotePrice = parseFloat(quoteData.fixedPrice || quoteData.amount);
            const requestPrice = parseFloat(request.fixed_price);

            if (Math.abs(quotePrice - requestPrice) > 0.01) {
                throw new Error('Quote must match the fixed price set by the buyer.');
            }

            if (quoteData.priceType !== 'fixed') {
                throw new Error('Quote must be of type fixed when buyer specifies a fixed price.');
            }
        }

        // ====================================================================
        // COMMAND 6.5: FREE TIER RESTRICTION (Enforce Fixed Price)
        // ====================================================================
        if (seller.subscriptionTier === 'free') {
            if (quoteData.priceType !== 'fixed' && !quoteData.fixedPrice) {
                throw new Error('PLAN RESTRICTION: Free Tier sellers can only submit Fixed Price quotes.');
            }
        }

        // ====================================================================
        // COMMAND 7: SMART PRICING MATRIX (Plan B Seller Exclusive)
        // ====================================================================
        if (quoteData.useSmartPricing) {
            // Checking Entitlement (Plan B) is fine in Service
            if (seller.subscriptionTier !== 'plan_b') {
                throw new Error('Smart Pricing is exclusive to Plan B sellers');
            }

            const calculation = await SmartPricingService.calculateSmartPrice(
                sellerId,
                parseFloat(request.quantity || 1),
                request.delivery_city
            );

            if (!calculation) {
                throw new Error('Smart Pricing: No applicable rule found for this request criteria (Quantity/City mismatch).');
            }

            quoteData.priceType = 'fixed';
            quoteData.fixedPrice = calculation.totalAmount;
            quoteData.amount = calculation.totalAmount;
            quoteData.deliveryCost = calculation.deliveryCost;
            quoteData.notes = (quoteData.notes || '') + `\n[Auto-quoted via Smart Pricing: ${calculation.ruleName}]`;
        }

        const submittedPrice = quoteData.priceType === 'fixed'
            ? quoteData.fixedPrice
            : quoteData.priceRangeMin;

        if (!submittedPrice || submittedPrice <= 0) {
            throw new Error('Invalid price amount');
        }

        const quote = await PriceQuote.create({
            ...quoteData,
            sellerId: sellerId,
            status: 'pending'
        });

        await request.increment('quoteCount');

        // TRIGGER TRANSITION: PUBLISHED -> QUOTING (System)
        if (request.status === 'published') {
            try {
                // Construct System Context (Use Owner ID to satisfy FK constraints)
                const systemActorId = process.env.OWNER_ID || '11111111-1111-1111-1111-111111111111';
                const systemAuth = {
                    actor: { id: systemActorId, name: 'System (Auto)' },
                    ip: '127.0.0.1',
                    userAgent: 'Internal/Service'
                };
                await RequestService.transitionRequestStatus(request.id, 'quoting', systemAuth, 'System Transition: First Quote Received');
            } catch (e) {
                console.warn(`[QuoteService] Failed to transition to QUOTING: ${e.message}`);
            }
        }

        return quote;
    }

    /**
     * Get Safe Quotes (Filtered by Privacy Rules)
     * Service logic is blind to Roles. It respects the View Mode passed by Controller.
     * 
     * @param {string} requestId 
     * @param {string} viewerId - ID of user viewing
     * @param {Object} options - Visibility Flags
     * @param {boolean} options.maskCompetitors - If true, masks data of other sellers
     * @param {boolean} options.onlyOwnQuotes - If true, filters query to only show viewer's quotes
     */
    static async getSafeQuotes(requestId, viewerId, options = {}) {
        const { maskCompetitors = false, onlyOwnQuotes = false } = options;

        // 1. Fetch Request
        const request = await PurchaseRequest.findByPk(requestId);
        if (!request) throw new Error('Request not found');

        // 2. Build Query
        const whereClause = { purchaseRequestId: requestId };

        if (onlyOwnQuotes) {
            whereClause.sellerId = viewerId;
        }

        const quotes = await PriceQuote.findAll({
            where: whereClause,
            include: [{
                model: User,
                as: 'seller',
                attributes: ['id', 'name', 'businessName', 'rank', 'rating', 'subscriptionTier']
            }],
            order: [['createdAt', 'DESC']]
        });

        // 3. Post-Processing (Masking)
        if (maskCompetitors) {
            return quotes.map(quote => {
                const q = quote.get({ plain: true });
                // If masking is ON, hide data unless it's the viewer's own quote
                if (q.sellerId !== viewerId) {
                    q.seller = { name: 'بائع آخر', businessName: '---', rank: null };
                    q.amount = null; // Hide Price
                    q.notes = 'عرض مخفي';
                    q.priceType = null;
                }
                return q;
            });
        }

        return quotes;
    }

    /**
     * Get seller's submitted quotes
     */
    static async getSellerQuotes(sellerId) {
        return await PriceQuote.findAll({
            where: { sellerId },
            include: [{ model: PurchaseRequest, as: 'request' }]
        });
    }

    /**
     * Withdraw a quote
     */
    static async withdrawQuote(quoteId, sellerId, reason) {
        const quote = await PriceQuote.findByPk(quoteId);
        if (!quote) throw new Error('Quote not found');

        if (quote.sellerId !== sellerId) {
            throw new Error('Unauthorized');
        }

        if (!quote.canBeWithdrawn()) {
            throw new Error('Quote cannot be withdrawn in its current status');
        }

        quote.status = 'withdrawn';
        quote.withdrawnAt = new Date();
        quote.withdrawalReason = reason;
        await quote.save();

        // Log withdrawal
        await WithdrawalLog.create({
            quoteId: quote.id,
            sellerId: sellerId,
            reason: reason,
            timestamp: new Date()
        });

        return quote;
    }

    /**
     * Accept a quote
     * @param {number} quoteId 
     * @param {string} buyerId 
     */
    static async acceptQuote(quoteId, buyerId) {
        const quote = await PriceQuote.findByPk(quoteId, {
            include: [{ model: PurchaseRequest, as: 'request' }]
        });

        if (!quote) throw new Error('Quote not found');

        const request = quote.request;
        if (request.userId !== buyerId) {
            throw new Error('Unauthorized: Only the request owner can accept quotes');
        }

        if (quote.status !== 'pending' && quote.status !== 'negotiating') {
            throw new Error('Quote is not in a state to be accepted');
        }

        // 1. Update Quote Status
        quote.status = 'accepted';
        quote.acceptedAt = new Date();
        await quote.save();

        // 2. Update Request Status using Strict Transition Logic
        // This will trigger Deal Creation & Invoice Generation in RequestService
        const user = await User.findByPk(buyerId);
        const updatedRequest = await RequestService.transitionRequestStatus(request.id, 'accepted', user);

        // 3. Reject other quotes
        await PriceQuote.update(
            { status: 'rejected' },
            {
                where: {
                    purchaseRequestId: request.id,
                    id: { [Op.ne]: quoteId },
                    status: 'pending'
                }
            }
        );

        // Return the deal that was created (need to fetch it)
        const deal = await Deal.findOne({ where: { purchaseRequestId: request.id } });
        return deal;
    }
}

module.exports = QuoteService;
