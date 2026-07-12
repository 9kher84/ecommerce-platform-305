const asyncHandler = require("express-async-handler");
const { Product, Category, SmartInventory } = require("../sequelize_setup");
const { encrypt } = require("../utils/securityUtils");
const { logSilentProfile } = require("../services/silentRiskProfiler");
const {
  sanitizeNegotiationUpdates,
} = require("../services/negotiationPolicyService");
const {
  processProductOpportunity,
} = require("../services/notificationPolicyService");
const {
  cacheBulkData,
  retrieveAndInvalidate,
} = require("../services/bulkPreviewCacheService");
const { Op } = require("sequelize");

/**
 * @desc   Get seller's inventory
 * @route  GET /api/products
 * @access Private (Seller)
 */
// OPTIMIZE: This query could be cached.
exports.getProducts = asyncHandler(async (req, res) => {
  const products = await Product.findAll({
    where: { sellerId: req.user.id },
    attributes: [
      "id",
      "name",
      "estimatedPrice",
      "stockLevel",
      "image",
      "categoryId",
      "createdAt",
    ], // Lean Selection
    include: [
      {
        model: Category,
        as: "category",
        attributes: ["id", "name_ar", "name_en"],
      },
    ],
    order: [["createdAt", "DESC"]],
  });

  res.status(200).json({
    success: true,
    count: products.length,
    products,
  });
});

/**
 * @desc   Add new product to inventory (Basic & tiered)
 * @route  POST /api/products
 * @access Private (Seller)
 */
exports.addProduct = asyncHandler(async (req, res) => {
  let {
    name,
    categoryId,
    quantity,
    unit,
    description,
    origin,
    productionDate,
    estimatedPrice,
    deliveryTime,
    stockLevel,
    image,
    purchasePrice,
    productTier,
  } = req.body;

  // A. I18n Structure Handling
  let structuredName = name;
  if (typeof name === "string") {
    structuredName = { ar: name, en: name };
  }

  let structuredDesc = description;
  if (typeof description === "string") {
    structuredDesc = { ar: description, en: description };
  } else if (!description && req.body.specs) {
    structuredDesc = { ar: req.body.specs, en: req.body.specs };
  }

  // B. Encryption (Purchase Price)
  let encryptedPurchasePrice = null;
  if (purchasePrice) {
    encryptedPurchasePrice = await encrypt(purchasePrice.toString());
  }

  // 2. Create Product
  const product = await Product.create({
    sellerId: req.user.id,
    name: structuredName,
    categoryId,
    stockLevel: quantity || stockLevel || 0,
    unit: unit || "piece",
    description: structuredDesc,
    origin,
    productionDate,
    estimatedPrice,
    purchasePrice: encryptedPurchasePrice,
    deliveryTime,
    image,
    productTier: productTier || "basic",
  });

  // 3. Create Smart Inventory Entry
  await SmartInventory.create({
    productId: product.id,
    sellerId: req.user.id,
    storageCapacity: 0,
    expectedIncomingStock: [],
    storageDurationDays: 0,
    warehousePressureScore: 0.0,
  });

  // 4. Notifications Logic (Sovereign Service Call)
  // Defer to policy service
  processProductOpportunity(req.user.id, categoryId);

  // 5. Silent Profiling (Safe Service)
  logSilentProfile("PRODUCT_ADD", {
    sellerId: req.user.id,
    tier: productTier,
  });

  res.status(201).json({
    success: true,
    product: {
      ...product.toJSON(),
      purchasePrice: undefined,
    },
  });
});

/**
 * @desc   Update product
 * @route  PUT /api/products/:id
 * @access Private (Seller)
 */
exports.updateProduct = asyncHandler(async (req, res) => {
  const product = await Product.findOne({
    where: { id: req.params.id, sellerId: req.user.id },
  });

  if (!product) {
    res.status(404);
    throw new Error("المنتج غير موجود");
  }

  const {
    name,
    categoryId,
    quantity,
    unit,
    description,
    origin,
    productionDate,
    estimatedPrice,
    deliveryTime,
    stockLevel,
    image,
    purchasePrice,
    productTier,
    autoNegotiationEnabled,
    minAcceptablePrice,
    negotiationStrategy,
  } = req.body;

  // Profile old state
  const oldPrice = product.estimatedPrice;
  const oldStock = product.stockLevel;

  // Prepare Updates
  const updates = {};
  if (name)
    updates.name = typeof name === "string" ? { ar: name, en: name } : name;
  if (description)
    updates.description =
      typeof description === "string"
        ? { ar: description, en: description }
        : description;
  if (categoryId) updates.categoryId = categoryId;
  if (quantity !== undefined) updates.stockLevel = quantity;
  if (stockLevel !== undefined) updates.stockLevel = stockLevel;
  if (unit) updates.unit = unit;
  if (origin) updates.origin = origin;
  if (productionDate) updates.productionDate = productionDate;
  if (estimatedPrice) updates.estimatedPrice = estimatedPrice;
  if (deliveryTime) updates.deliveryTime = deliveryTime;
  if (image) updates.image = image;

  // Encrypt sensitive update
  if (purchasePrice) {
    updates.purchasePrice = await encrypt(purchasePrice.toString());
  }

  // AI/Tier B logic - SOVEREIGN SERVICE CHECK
  if (productTier) updates.productTier = productTier;
  if (autoNegotiationEnabled !== undefined)
    updates.autoNegotiationEnabled = autoNegotiationEnabled;
  if (minAcceptablePrice) updates.minAcceptablePrice = minAcceptablePrice;
  if (negotiationStrategy) updates.negotiationStrategy = negotiationStrategy;

  // Sanitization Step
  const sanitizedUpdates = await sanitizeNegotiationUpdates(
    req.user.id,
    updates,
  );

  await product.update(sanitizedUpdates);

  // Silent Profiling (Safe Service)
  // Trigger Early Warning System (Phase 2)
  if (oldStock !== product.stockLevel) {
    const InventoryAlertService = require("../services/InventoryAlertService");
    const smartInventory = await SmartInventory.findOne({
      where: { productId: product.id },
    });
    if (smartInventory) {
      await InventoryAlertService.checkAndAlert(smartInventory.id);
    }
  }

  res.status(200).json({
    success: true,
    product: {
      ...product.toJSON(),
      purchasePrice: undefined,
    },
  });
});

/**
 * @desc   Approve AI Proposal for Product Enrichment
 * @route  POST /api/products/:id/approve-proposal
 * @access Private (Seller)
 */
exports.approveProposal = asyncHandler(async (req, res) => {
  const product = await Product.findOne({
    where: { id: req.params.id, sellerId: req.user.id },
  });

  if (!product) {
    res.status(404);
    throw new Error("المنتج غير موجود");
  }

  if (!product.ai_proposals || Object.keys(product.ai_proposals).length === 0) {
    res.status(400);
    throw new Error("لا توجد اقتراحات ذكية لاعتمادها");
  }

  // Merge the proposals into the product fields
  const updates = {
    ...product.ai_proposals,
    ai_proposals: null // Clear proposals after approval
  };

  await product.update(updates);

  res.status(200).json({
    success: true,
    message: "تم اعتماد التحديثات الذكية بنجاح",
    product: product
  });
});

/**
 * @desc   Get Smart Inventory (Seller Only)
 * @route  GET /api/products/:id/smart-inventory
 * @access Private (Seller)
 */
exports.getSmartInventory = asyncHandler(async (req, res) => {
  const smartInv = await SmartInventory.findOne({
    where: { productId: req.params.id, sellerId: req.user.id },
  });

  if (!smartInv) {
    res.status(404);
    throw new Error("Smart Inventory not found");
  }

  res.status(200).json({
    success: true,
    smartInventory: smartInv,
  });
});

/**
 * @desc   Update Smart Inventory (Seller Only)
 * @route  PUT /api/products/:id/smart-inventory
 * @access Private (Seller)
 */
exports.updateSmartInventory = asyncHandler(async (req, res) => {
  let smartInv = await SmartInventory.findOne({
    where: { productId: req.params.id, sellerId: req.user.id },
  });

  if (!smartInv) {
    // Create if missing (Repair)
    smartInv = await SmartInventory.create({
      productId: req.params.id,
      sellerId: req.user.id,
    });
  }

  const {
    storageCapacity,
    expectedIncomingStock,
    storageDurationDays,
    manufactureDate,
  } = req.body;

  await smartInv.update({
    storageCapacity,
    expectedIncomingStock,
    storageDurationDays,
    manufactureDate,
  });

  res.status(200).json({
    success: true,
    smartInventory: smartInv,
  });
});

/**
 * @desc   Bulk Upload API (Secure Preview)
 * @route  POST /api/products/bulk
 * @access Private (Seller)
 */
exports.bulkUpload = asyncHandler(async (req, res) => {
  let extractedData = [];
  
  if (req.body.rawText) {
    // 🧠 AI Extraction Simulation (OCR/LLM)
    // Converts unstructured text like "Iron 16mm - 50\nCement - 15" into JSON
    const lines = req.body.rawText.split('\n');
    extractedData = lines.filter(line => line.trim() !== '').map(line => {
      const parts = line.split('-'); // Simple heuristic for mock
      return {
        name: parts[0]?.trim() || line.trim(),
        estimatedPrice: parts[1] ? parseFloat(parts[1].trim()) : null,
        unit: "piece" // Auto-defaulted by our previous frictionless logic
      };
    });
  } else {
    extractedData = req.body.data || [];
  }

  // 2. Do NOT Save automatically - Cache with Service
  const { token, expiresInSeconds } = await cacheBulkData(extractedData);

  // Return preview to user
  res.status(200).json({
    success: true,
    message: "تم تحليل البيانات بنجاح. يرجى مراجعة المسودة وتأكيدها.",
    preview: extractedData,
    previewToken: token,
    expiresInSeconds,
  });
});

/**
 * @desc   Confirm Bulk Upload
 * @route  POST /api/products/bulk/confirm
 * @access Private (Seller)
 */
exports.confirmBulkUpload = asyncHandler(async (req, res) => {
  const { previewToken } = req.body;

  if (!previewToken) {
    res.status(400);
    throw new Error("Preview token required");
  }

  // 1. Retrieve cached preview data
  const data = await retrieveAndInvalidate(previewToken);

  if (!data || !Array.isArray(data)) {
    res.status(400);
    throw new Error("Invalid or expired preview token");
  }

  // 2. Insert to DB
  const results = [];
  for (const item of data) {
    // Basic structured name logic
    let structuredName = item.name;
    if (typeof item.name === "string") {
      structuredName = { ar: item.name, en: item.name };
    }

    const product = await Product.create({
      sellerId: req.user.id,
      name: structuredName,
      estimatedPrice: item.estimatedPrice,
      unit: item.unit || "piece",
      stockLevel: 0
    });

    // Create Smart Inventory Entry silently
    await SmartInventory.create({
      productId: product.id,
      sellerId: req.user.id,
      storageCapacity: 0,
      expectedIncomingStock: [],
      storageDurationDays: 0,
      warehousePressureScore: 0.0,
    });

    results.push(product.id);
  }

  res.status(200).json({
    success: true,
    message: "تم حفظ الكاتالوج بنجاح.",
    count: results.length,
  });
});

/**
 * @desc   Delete product
 * @route  DELETE /api/products/:id
 * @access Private (Seller)
 */
exports.deleteProduct = asyncHandler(async (req, res) => {
  const product = await Product.findOne({
    where: { id: req.params.id, sellerId: req.user.id },
  });

  if (!product) {
    res.status(404);
    throw new Error("المنتج غير موجود");
  }

  await product.destroy();

  res.status(200).json({
    success: true,
    message: "تم حذف المنتج بنجاح",
  });
});

/**
 * @desc   Upload product image from URL (with SSRF protection)
 * @route  POST /api/products/upload
 * @access Private (Seller)
 */
exports.uploadImage = asyncHandler(async (req, res) => {
  const { imageUrl } = req.body;

  if (!imageUrl) {
    res.status(400);
    throw new Error("Image URL is required");
  }

  const { fetchImageProtected } = require("../utils/fetchProtected");

  try {
    const imageBuffer = await fetchImageProtected(imageUrl);

    res.status(200).json({
      success: true,
      message: "Image fetched successfully (SSRF protection passed)",
      imageSize: imageBuffer.length,
      imageUrl: imageUrl,
    });
  } catch (error) {
    if (error.message.includes("SSRF") || error.message.includes("forbidden")) {
      res.status(403);
      throw new Error(`Forbidden: ${error.message}`);
    }
    res.status(400);
    throw new Error(`Failed to fetch image: ${error.message}`);
  }
});
