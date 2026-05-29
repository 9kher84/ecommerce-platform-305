const express = require("express");
const router = express.Router();
const PricingMatrixController = require("../controllers/pricingMatrixController");
const { protect, restrictTo } = require("../middleware/authMiddleware");

// All routes require authentication and 'seller' role
router.use(protect);
router.use(restrictTo("seller"));

// Routes
router.post("/", PricingMatrixController.createMatrix);
router.get("/", PricingMatrixController.getMyMatrices);
router.put("/:id", PricingMatrixController.updateMatrix);
router.delete("/:id", PricingMatrixController.deleteMatrix);

module.exports = router;
