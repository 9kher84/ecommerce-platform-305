const { Deal, PurchaseRequest } = require("../sequelize_setup");
const asyncHandler = require("express-async-handler");
const AppError = require("../utils/appError");

/**
 * 🛡️ Sovereign Invoice Controller
 */
exports.extractText = asyncHandler(async (req, res) => {
  const { id, text, type } = req.body; // type: 'deal' or 'request'

  if (!id || !text) {
    throw new AppError("ID and text are required", 400);
  }

  let model;
  if (type === "deal") model = Deal;
  else if (type === "request") model = PurchaseRequest;
  else throw new AppError("Invalid type", 400);

  const record = await model.findByPk(id);
  if (!record) throw new AppError("Record not found", 404);

  // Encrypt is handled by model setter
  await record.update({ invoiceText: text });

  res.status(200).json({
    success: true,
    message: "Invoice text stored securely (Encrypted at Rest).",
  });
});
