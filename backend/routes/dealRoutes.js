// C:\Users\s9khr\sasasa\ecommerce-platform\backend\routes\dealRoutes.js

const express = require("express");
const router = express.Router();
const dealController = require("../controllers/dealController");
const { protect } = require("../middleware/authMiddleware");
const {
  validateUpdateDealStatus,
} = require("../middleware/validationMiddleware");

router.use(protect);

router.route("/").get(dealController.getDeals);

router.route("/:id").get(dealController.getDealById);

router
  .route("/:id/status")
  .patch(validateUpdateDealStatus, dealController.updateDealStatus);

module.exports = router;
