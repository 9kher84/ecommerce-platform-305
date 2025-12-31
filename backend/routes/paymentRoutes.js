const express = require('express');
const router = express.Router();
const { protect, restrictTo } = require('../middleware/authMiddleware');
const { Deal, PurchaseRequest } = require('../sequelize_setup');

/**
 * ========================================================================
 * COMMAND 9: PAYMENT WEBHOOK ENDPOINT
 * ========================================================================
 * Handles payment confirmation webhooks from external payment providers
 */

/**
 * @route   POST /api/payments/webhook
 * @desc    Handle payment webhook from payment provider
 * @access  Public (but should verify signature)
 */
router.post('/webhook', async (req, res) => {
    try {
        const {
            transactionId,
            dealId,
            status,
            amount,
            currency,
            signature // For verification
        } = req.body;

        console.log('[Payment Webhook] Received:', {
            transactionId,
            dealId,
            status,
            amount,
            currency
        });

        // TODO: Verify webhook signature from payment provider
        // const isValid = verifyWebhookSignature(req.body, signature);
        // if (!isValid) {
        //     return res.status(401).json({ success: false, message: 'Invalid signature' });
        // }

        // Find the deal
        const deal = await Deal.findByPk(dealId);

        if (!deal) {
            console.error('[Payment Webhook] Deal not found:', dealId);
            return res.status(404).json({
                success: false,
                message: 'Deal not found'
            });
        }

        // Update deal status based on payment status
        if (status === 'success' || status === 'completed' || status === 'paid') {
            await deal.update({
                status: 'paid',
                notes: deal.notes ?
                    `${deal.notes}\n[${new Date().toISOString()}] Payment confirmed: ${transactionId}` :
                    `Payment confirmed: ${transactionId}`
            });

            console.log(`✅ [Payment Webhook] Deal ${dealId} marked as paid`);

            // TODO: Send notification to buyer and seller
            // await NotificationService.sendPaymentConfirmation(deal);

            return res.status(200).json({
                success: true,
                message: 'Payment confirmed',
                data: { dealId, status: 'paid' }
            });
        } else if (status === 'failed' || status === 'cancelled') {
            await deal.update({
                notes: deal.notes ?
                    `${deal.notes}\n[${new Date().toISOString()}] Payment failed: ${transactionId}` :
                    `Payment failed: ${transactionId}`
            });

            console.log(`❌ [Payment Webhook] Deal ${dealId} payment failed`);

            return res.status(200).json({
                success: true,
                message: 'Payment status updated',
                data: { dealId, status: 'failed' }
            });
        }

        // Unknown status
        return res.status(400).json({
            success: false,
            message: 'Unknown payment status'
        });

    } catch (error) {
        console.error('[Payment Webhook] Error:', error);
        return res.status(500).json({
            success: false,
            message: 'Internal server error'
        });
    }
});

/**
 * @route   GET /api/payments/status/:dealId
 * @desc    Get payment status for a deal
 * @access  Private
 */
router.get('/status/:dealId', protect, async (req, res) => {
    try {
        const deal = await Deal.findByPk(req.params.dealId);

        if (!deal) {
            return res.status(404).json({
                success: false,
                message: 'Deal not found'
            });
        }

        // Check authorization
        if (deal.buyerId !== req.user.id && deal.sellerId !== req.user.id && req.user.role !== 'admin') {
            return res.status(403).json({
                success: false,
                message: 'Not authorized to view this payment status'
            });
        }

        return res.status(200).json({
            success: true,
            data: {
                dealId: deal.id,
                status: deal.status,
                amount: deal.finalAmount
            }
        });

    } catch (error) {
        console.error('[Payment Status] Error:', error);
        return res.status(500).json({
            success: false,
            message: 'Internal server error'
        });
    }
});

module.exports = router;
