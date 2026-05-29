const express = require("express");
const router = express.Router();
const { protect, isSeller } = require("../middleware/authMiddleware");
const {
  getProducts,
  addProduct,
  updateProduct,
  deleteProduct,
  uploadImage,
  getSmartInventory,
  updateSmartInventory,
  bulkUpload,
  confirmBulkUpload,
} = require("../controllers/productController");

// All Routes Protected and Seller Only
router.use(protect);
router.use(isSeller);

/**
 * @swagger
 * /api/products:
 *   get:
 *     summary: Get seller products
 *     tags: [Products]
 *     security:
 *       - cookieAuth: []
 *     responses:
 *       200:
 *         description: List of products
 *   post:
 *     summary: Add new product
 *     tags: [Products]
 *     security:
 *       - cookieAuth: []
 *     responses:
 *       201:
 *         description: Product added
 */
router.route("/").get(getProducts).post(addProduct);

/**
 * @swagger
 * /api/products/bulk:
 *   post:
 *     summary: Bulk upload products
 *     tags: [Products]
 *     security:
 *       - cookieAuth: []
 *     responses:
 *       200:
 *         description: Upload successful
 */
router.post("/bulk", bulkUpload);

/**
 * @swagger
 * /api/products/bulk/confirm:
 *   post:
 *     summary: Confirm bulk upload
 *     tags: [Products]
 *     security:
 *       - cookieAuth: []
 *     responses:
 *       200:
 *         description: Bulk upload confirmed
 */
router.post("/bulk/confirm", confirmBulkUpload);

/**
 * @swagger
 * /api/products/upload:
 *   post:
 *     summary: Upload product image
 *     tags: [Products]
 *     security:
 *       - cookieAuth: []
 *     responses:
 *       200:
 *         description: Image uploaded
 */
router.post("/upload", uploadImage);

/**
 * @swagger
 * /api/products/{id}/smart-inventory:
 *   get:
 *     summary: Get smart inventory details
 *     tags: [Products]
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
 *         description: Inventory details
 *   put:
 *     summary: Update smart inventory
 *     tags: [Products]
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
 *         description: Inventory updated
 */
router
  .route("/:id/smart-inventory")
  .get(getSmartInventory)
  .put(updateSmartInventory);

/**
 * @swagger
 * /api/products/{id}:
 *   put:
 *     summary: Update product
 *     tags: [Products]
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
 *         description: Product updated
 *   delete:
 *     summary: Delete product
 *     tags: [Products]
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
 *         description: Product deleted
 */
router.route("/:id").put(updateProduct).delete(deleteProduct);

module.exports = router;
