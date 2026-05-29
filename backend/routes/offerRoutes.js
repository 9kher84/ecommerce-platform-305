const express = require("express");
const router = express.Router({ mergeParams: true }); // mergeParams allows access to :postId from parent router
const offerController = require("../controllers/offerController");
const { protect, authorize } = require("../middleware/authMiddleware");
const { validateCreateOffer } = require("../middleware/validationMiddleware");

// ----------------------------------------------------------------------
// Offer Routes (Nested under /api/posts/:postId/offers)
// ----------------------------------------------------------------------

// 1. Get Offers for a Post
// - Buyer (owner) can view offers on their post.
// - Admin/SuperAdmin can view.
router
  .route("/")
  .get(
    protect,
    authorize("buyer", "admin", "super_admin"),
    offerController.getPostOffers,
  )

  // 2. Create an Offer
  // - Seller can create an offer on a post.
  .post(
    protect,
    authorize("seller", "admin", "super_admin"),
    validateCreateOffer,
    offerController.createOffer,
  );

module.exports = router;
