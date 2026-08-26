const express = require("express");
const router = express.Router();
const invoiceController = require("../controllers/invoiceController");
const { protect } = require("../middleware/authMiddleware");
const InvoiceService = require("../services/invoiceService");

// Public route for WhatsApp links
router.get("/public/:token", async (req, res, next) => {
  try {
    const invoice = await InvoiceService.getInvoiceByToken(req.params.token);
    res.status(200).json({ success: true, data: invoice });
  } catch (err) {
    next(err);
  }
});

router.use(protect);

/**
 * @desc    Get B2B Invoice eligibility for a Purchase Order
 * @route   GET /api/invoice/eligibility/:poId
 */
router.get("/eligibility/:poId", invoiceController.getPOInvoiceEligibility);

/**
 * @desc    Issue B2B Commercial Invoice from Purchase Order
 * @route   POST /api/invoice/issue
 */
router.post("/issue", invoiceController.issuePOInvoice);

/**
 * @desc    Store extracted OCR text from invoice securely
 * @route   POST /api/invoice/extract-text
 */
router.post("/extract-text", invoiceController.extractText);

router.get("/my", async (req, res, next) => {
  try {
    const { Invoice } = require("../sequelize_setup");
    const { Op } = require("sequelize");

    const invoices = await Invoice.findAll({
      where: {
        [Op.or]: [{ buyerId: req.user.id }, { sellerId: req.user.id }],
      },
      order: [["createdAt", "DESC"]],
    });

    res
      .status(200)
      .json({ success: true, count: invoices.length, data: invoices });
  } catch (err) {
    next(err);
  }
});

router.get("/:id", async (req, res, next) => {
  try {
    const invoice = await InvoiceService.getInvoiceById(
      req.params.id,
      req.user.id,
      req.user.role,
    );
    res.status(200).json({ success: true, data: invoice });
  } catch (err) {
    next(err);
  }
});

router.post("/:id/proof", async (req, res, next) => {
  try {
    const { files, description } = req.body;
    const invoice = await InvoiceService.uploadDeliveryProof(
      req.params.id,
      files,
      description,
      req.user.id,
    );
    res.status(200).json({ success: true, data: invoice });
  } catch (err) {
    next(err);
  }
});

router.post("/:id/confirm", async (req, res, next) => {
  try {
    const invoice = await InvoiceService.confirmDeliveryByBuyer(
      req.params.id,
      req.user.id,
    );
    res.status(200).json({ success: true, data: invoice });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
