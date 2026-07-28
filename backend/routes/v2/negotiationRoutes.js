const express = require('express');
const router = express.Router();
const NegotiationController = require('../../src/modules/sales/infrastructure/api/NegotiationController');
const { protect } = require('../../middleware/authMiddleware');

router.use(protect);

// WorkPackage routes
router.post('/work-packages/:workPackageId/proposals', NegotiationController.submitInitialProposal);
router.get('/work-packages/:id/matrix', NegotiationController.getMatrix);

// Inbox & Awards
router.get('/inbox', NegotiationController.getInbox);
router.post('/awards/checkout', NegotiationController.checkoutAwards);

// CommercialProcess / Negotiation Routes
router.get('/:id/timeline', NegotiationController.getTimeline);
router.post('/:id/revisions', NegotiationController.submitRevision);
router.post('/:id/accept', NegotiationController.acceptRevision);
router.post('/:id/reject', NegotiationController.rejectRevision);

module.exports = router;
