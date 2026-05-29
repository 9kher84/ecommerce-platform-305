const express = require("express");
const router = express.Router();
const { protect } = require("../middleware/authMiddleware");
const ratingController = require("../controllers/ratingController");

// جميع مسارات التقييم محمية
router.use(protect);

router.route("/").post(ratingController.createRating);

router.route("/user/:userId").get(ratingController.getUserRatings);

module.exports = router;
