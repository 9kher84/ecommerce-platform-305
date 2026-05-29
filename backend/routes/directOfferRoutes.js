const express = require("express");
const router = express.Router();
const offerController = require("../controllers/offerController");
const { protect, authorize } = require("../middleware/authMiddleware");

router.use(protect);

router
  .route("/:offerId")
  .delete(protect, authorize("seller", "admin"), offerController.deleteOffer); // صاحب العرض (البائع) يلغيه

router
  .route("/:offerId/accept")
  .patch(
    authorize("buyer", "admin", "super_admin"),
    offerController.acceptOffer,
  ); // المشتري يقبل العرض

module.exports = router;
