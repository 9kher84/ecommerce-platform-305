const express = require("express");
const router = express.Router();
const requestController = require("../controllers/requestController");
const offerRoutes = require("./offerRoutes");
const { protect, restrictTo } = require("../middleware/authMiddleware");
const {
  validateCreatePost,
  validateUpdatePost,
} = require("../middleware/validationMiddleware");

// ----------------------------------------------------------------------
// 1. Post Routes (mapped to Request Controller)
// ----------------------------------------------------------------------

router
  .route("/")
  .get(
    protect,
    restrictTo("seller", "admin", "super_admin"),
    requestController.getAllRequests,
  )
  .post(
    protect,
    restrictTo("buyer", "admin", "super_admin"),
    validateCreatePost,
    requestController.createRequest,
  );

router
  .route("/:id")
  .get(requestController.getRequestById)
  .put(
    protect,
    restrictTo("buyer", "admin", "super_admin"),
    validateUpdatePost,
    requestController.editRequest,
  )
  .delete(
    protect,
    restrictTo("buyer", "admin", "super_admin"),
    requestController.cancelRequest,
  );

// ----------------------------------------------------------------------
// 2. Nested Offer Routes
// ----------------------------------------------------------------------
router.use("/:postId/offers", offerRoutes);

module.exports = router;
