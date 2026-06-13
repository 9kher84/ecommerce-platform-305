const express = require("express");
const router = express.Router();
const requestController = require("../controllers/requestController");
const requestStatusController = require("../controllers/requestStatusController");
const { protect, restrictTo } = require("../middleware/authMiddleware");
const validateRequest = require("../middleware/validatorMiddleware");
const { createRequestSchema } = require("../validators/requestValidators");
const authorize = require("../middleware/authorize");
const loadResource = require("../middleware/resourceLoader");
const { PurchaseRequest } = require("../sequelize_setup");

// ============================================================
// PURCHASE REQUEST ROUTES
// ============================================================

/**
 * @swagger
 * /api/requests:
 *   get:
 *     summary: Get all requests (Public/Browsing)
 *     tags: [Requests]
 *     responses:
 *       200:
 *         description: List of purchase requests
 *   post:
 *     summary: Create a new purchase request
 *     tags: [Requests]
 *     security:
 *       - cookieAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/PurchaseRequest'
 *     responses:
 *       201:
 *         description: Request created
 */
router.get("/", requestController.getAllRequests);
router.post(
  "/",
  protect,
  authorize("CREATE_REQUEST"), // Permission check only
  validateRequest(createRequestSchema),
  requestController.createRequest,
);

/**
 * @swagger
 * /api/requests/my-requests:
 *   get:
 *     summary: Get my purchase requests
 *     tags: [Requests]
 *     security:
 *       - cookieAuth: []
 *     responses:
 *       200:
 *         description: User's requests
 */
router.get(
  "/my-requests",
  protect,
  authorize("VIEW_REQUESTS"),
  requestController.getMyRequests,
);

/**
 * @swagger
 * /api/requests/published:
 *   get:
 *     summary: Get published requests
 *     tags: [Requests]
 *     security:
 *       - cookieAuth: []
 *     responses:
 *       200:
 *         description: Published requests
 */
router.get(
  "/published",
  protect,
  authorize(null, null, "viewPublished"),
  requestController.getPublishedRequests,
);

/**
 * @swagger
 * /api/requests/{id}/quotes:
 *   get:
 *     summary: Get quotes for a request
 *     tags: [Requests]
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
 *         description: List of quotes
 *   post:
 *     summary: Submit a quote for a request
 *     tags: [Requests]
 *     security:
 *       - cookieAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       201:
 *         description: Quote submitted
 */
router.get(
  "/:id/quotes",
  protect,
  loadResource(PurchaseRequest),
  authorize("viewQuotes", "Request"),
  requestController.getRequestQuotes,
);

router.post(
  "/:id/quotes",
  protect,
  loadResource(PurchaseRequest),
  authorize("CREATE_QUOTE", "Request", "submitQuote"),
  requestController.submitQuoteForRequest,
);

// ============================================================
// STATUS TRANSITION ROUTES
// ============================================================

/**
 * @swagger
 * /api/requests/{id}/status:
 *   put:
 *     summary: Update request status
 *     tags: [Requests]
 *     security:
 *       - cookieAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               status:
 *                 type: string
 *     responses:
 *       200:
 *         description: Status updated
 */
router.put(
  "/:id/status",
  protect,
  loadResource(PurchaseRequest),
  authorize(null, "Request", "update"),
  requestStatusController.updateRequestStatus,
);

/**
 * @swagger
 * /api/requests/{id}/status-history:
 *   get:
 *     summary: Get status history
 *     tags: [Requests]
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
 *         description: Status history
 */
router.get(
  "/:id/status-history",
  protect,
  loadResource(PurchaseRequest),
  authorize(null, "Request", "view"),
  requestStatusController.getStatusHistory,
);

/**
 * @swagger
 * /api/requests/{id}/allowed-statuses:
 *   get:
 *     summary: Get allowed next statuses
 *     tags: [Requests]
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
 *         description: Allowed statuses
 */
router.get(
  "/:id/allowed-statuses",
  protect,
  loadResource(PurchaseRequest),
  authorize(null, "Request", "view"),
  requestStatusController.getAllowedStatuses,
);

// ============================================================
// INDIVIDUAL REQUEST ROUTES
// ============================================================

/**
 * @swagger
 * /api/requests/{id}:
 *   get:
 *     summary: Get request details
 *     tags: [Requests]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Request details
 *   put:
 *     summary: Edit request
 *     tags: [Requests]
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
 *         description: Request updated
 *   delete:
 *     summary: Cancel request
 *     tags: [Requests]
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
 *         description: Request cancelled
 */
router.get("/:id", requestController.getRequestById);

router.put(
  "/:id",
  protect,
  loadResource(PurchaseRequest),
  authorize(null, "Request", "update"),
  requestController.editRequest,
);

/**
 * @swagger
 * /api/requests/{id}/publish:
 *   post:
 *     summary: Publish request
 *     tags: [Requests]
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
 *         description: Request published
 */
router.post(
  "/:id/publish",
  protect,
  loadResource(PurchaseRequest),
  authorize(null, "Request", "publish"),
  requestController.publishRequest,
);

/**
 * @swagger
 * /api/requests/{id}/request-modification:
 *   post:
 *     summary: Request modification from admin
 *     tags: [Requests]
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
 *         description: Modification requested
 */
router.post(
  "/:id/request-modification",
  protect,
  loadResource(PurchaseRequest),
  authorize(null, "Request", "requestModification"),
  requestController.requestModification,
);

router.delete(
  "/:id",
  protect,
  loadResource(PurchaseRequest),
  authorize(null, "Request", "cancel"),
  requestController.cancelRequest,
);

/**
 * @swagger
 * /api/requests/{id}/repost:
 *   post:
 *     summary: Repost expired/completed request
 *     tags: [Requests]
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
 *         description: Request reposted
 */
router.post(
  "/:id/repost",
  protect,
  loadResource(PurchaseRequest),
  authorize(null, "Request", "repost"),
  requestController.repostRequest,
);

/**
 * @swagger
 * /api/requests/{id}/price-radar:
 *   get:
 *     summary: Get price radar statistics (Premium)
 *     tags: [Requests]
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
 *         description: Price radar stats
 */
router.get(
  "/:id/price-radar",
  protect,
  // restrictTo('seller', 'admin'), // Buyer might want to see it too if Premium?
  // Prompt said "Seller can see...". Let's restrict to seller/admin for now as per prompt implied context logic.
  // Actually, Prompt said "make it available... check subscription...".
  // I will allow 'seller' and 'admin'.
  // restrictTo('seller', 'admin'), BUT restrictTo logic isn't strictly imported or configured here fully?
  // restrictTo IS imported at line 5.
  restrictTo("seller", "admin"),
  requestController.getRadarData,
);

module.exports = router;
