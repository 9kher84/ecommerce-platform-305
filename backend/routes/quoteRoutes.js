const express = require("express");
const router = express.Router();
const quoteController = require("../controllers/quoteController");
const { protect } = require("../middleware/authMiddleware");
const authorize = require("../middleware/authorize");
const loadResource = require("../middleware/resourceLoader");
const { PriceQuote, PurchaseRequest } = require("../sequelize_setup");

// ============================================================
// PRICE QUOTE ROUTES
// ============================================================

/**
 * @swagger
 * /api/quotes:
 *   post:
 *     summary: Submit a price quote
 *     tags: [Quotes]
 *     security:
 *       - cookieAuth: []
 *     responses:
 *       201:
 *         description: Quote submitted
 */
const { sovereignLimiter } = require("../middleware/rateLimitMiddleware");

router.post(
  "/",
  protect,
  sovereignLimiter,
  authorize("CREATE_QUOTE"),
  quoteController.submitQuote,
);

/**
 * @swagger
 * /api/quotes/my-quotes:
 *   get:
 *     summary: Get my submitted quotes
 *     tags: [Quotes]
 *     security:
 *       - cookieAuth: []
 *     responses:
 *       200:
 *         description: My quotes
 */
router.get(
  "/my-quotes",
  protect,
  authorize("VIEW_QUOTES"),
  quoteController.getMyQuotes,
);

/**
 * @swagger
 * /api/quotes/request/{requestId}:
 *   get:
 *     summary: Get quotes for a purchase request
 *     tags: [Quotes]
 *     security:
 *       - cookieAuth: []
 *     parameters:
 *       - in: path
 *         name: requestId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Quotes for request
 */
router.get(
  "/request/:requestId",
  protect,
  loadResource(PurchaseRequest, "requestId"),
  authorize("viewQuotes", "Request"),
  quoteController.getQuotesForRequest,
);

/**
 * @swagger
 * /api/quotes/{id}/negotiate:
 *   post:
 *     summary: Buyer counters offer
 *     tags: [Quotes]
 *     security:
 *       - cookieAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Counter offer sent
 */
router.post(
  "/:id/negotiate",
  protect,
  loadResource(PriceQuote, "id", ["request"]),
  authorize(null, "Quote", "negotiate"),
  quoteController.negotiate,
);

/**
 * @swagger
 * /api/quotes/{id}/respond:
 *   post:
 *     summary: Seller responds to negotiation
 *     tags: [Quotes]
 *     security:
 *       - cookieAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Response sent
 */
router.post(
  "/:id/respond",
  protect,
  loadResource(PriceQuote),
  authorize(null, "Quote", "respond"),
  quoteController.respondToNegotiation,
);

/**
 * @swagger
 * /api/quotes/{id}/accept:
 *   post:
 *     summary: Accept a quote
 *     tags: [Quotes]
 *     security:
 *       - cookieAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Quote accepted
 */
router.post(
  "/:id/accept",
  protect,
  loadResource(PriceQuote, "id", ["request"]),
  authorize(null, "Quote", "accept"),
  quoteController.acceptQuote,
);

/**
 * @swagger
 * /api/quotes/{id}/reject:
 *   post:
 *     summary: Reject a quote
 *     tags: [Quotes]
 *     security:
 *       - cookieAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Quote rejected
 */
router.post(
  "/:id/reject",
  protect,
  loadResource(PriceQuote, "id", ["request"]),
  authorize(null, "Quote", "reject"),
  quoteController.rejectQuote,
);

/**
 * @swagger
 * /api/quotes/{id}/withdraw:
 *   post:
 *     summary: Withdraw a quote
 *     tags: [Quotes]
 *     security:
 *       - cookieAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Quote withdrawn
 */
router.post(
  "/:id/withdraw",
  protect,
  loadResource(PriceQuote),
  authorize(null, "Quote", "withdraw"),
  quoteController.withdrawQuote,
);

/**
 * @swagger
 * /api/quotes/{id}/modify:
 *   put:
 *     summary: Modify quote (Plan B)
 *     tags: [Quotes]
 *     security:
 *       - cookieAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Quote modified
 */
router.put(
  "/:id/modify",
  protect,
  loadResource(PriceQuote),
  authorize(null, "Quote", "modify"),
  quoteController.modifyAfterRejection,
);

router.post(
  "/:id/decision",
  protect,
  loadResource(PriceQuote, "id", ["request"]),
  authorize(null, "Quote", "accept"), // Reuse accept permission as it's the same buyer owner check
  quoteController.makeDecision,
);

module.exports = router;
