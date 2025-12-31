const { PurchaseRequest, User, Category, Deal, PriceQuote } = require('../sequelize_setup');
const SubscriptionService = require('./subscriptionService');
const StatusTransitionService = require('./statusTransitionService');
const { Op } = require('sequelize');

/**
 * RequestService Helper
 * Secure wrapper for status transitions
 */
class RequestServiceHelpers {

    /**
     * Safely transition request status using StatusTransitionService
     * @param {Object} request - PurchaseRequest instance
     * @param {string} newStatus - Target status
     * @param {Object} user - User performing the action
     * @param {string} reason - Reason for transition (optional)
     */
    static async transitionRequestStatus(request, newStatus, user, reason = null) {
        const result = await StatusTransitionService.transitionStatus(
            request.id,
            newStatus,
            user,
            reason
        );

        return result.request;
    }

    /**
     * Publish a draft request
     */
    static async publishRequest(requestId, userId) {
        const request = await PurchaseRequest.findByPk(requestId);
        if (!request) throw new Error('Request not found');

        const user = await User.findByPk(userId);
        if (!user) throw new Error('User not found');

        // Check ownership
        if (request.buyerId !== userId && user.role !== 'admin') {
            throw new Error('Unauthorized: Only the owner or admin can publish this request');
        }

        // Use StatusTransitionService for secure transition
        return await this.transitionRequestStatus(request, 'published', user, 'User published request');
    }

    /**
     * Cancel a request
     */
    static async cancelRequest(requestId, userId, reason) {
        const request = await PurchaseRequest.findByPk(requestId);
        if (!request) throw new Error('Request not found');

        const user = await User.findByPk(userId);
        if (!user) throw new Error('User not found');

        // Check authorization
        if (request.buyerId !== userId && user.role !== 'admin') {
            throw new Error('Unauthorized: Only the owner or admin can cancel this request');
        }

        return await this.transitionRequestStatus(request, 'cancelled', user, reason || 'User cancelled request');
    }

    /**
     * Accept a quote (transition to accepted)
     */
    static async acceptQuote(requestId, quoteId, userId) {
        const request = await PurchaseRequest.findByPk(requestId);
        if (!request) throw new Error('Request not found');

        const user = await User.findByPk(userId);
        if (!user) throw new Error('User not found');

        // Check ownership
        if (request.buyerId !== userId && user.role !== 'admin') {
            throw new Error('Unauthorized');
        }

        // Transition to accepted
        return await this.transitionRequestStatus(
            request,
            'accepted',
            user,
            `Quote ${quoteId} accepted`
        );
    }

    /**
     * Complete a deal (transition to completed)
     */
    static async completeRequest(requestId, userId) {
        const request = await PurchaseRequest.findByPk(requestId);
        if (!request) throw new Error('Request not found');

        const user = await User.findByPk(userId);
        if (!user) throw new Error('User not found');

        return await this.transitionRequestStatus(
            request,
            'completed',
            user,
            'Deal completed successfully'
        );
    }
}

module.exports = RequestServiceHelpers;
