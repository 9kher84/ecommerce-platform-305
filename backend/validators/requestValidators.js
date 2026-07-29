const Joi = require("joi");

const createRequestSchema = Joi.object({
  title: Joi.string().required().messages({
    "string.empty": "Title is required",
    "any.required": "Title is required",
  }),
  description: Joi.string().allow("", null),
  header: Joi.object().allow(null),
  quantity: Joi.number().positive().allow(null),
  unit: Joi.string().allow("", null),
  categoryId: Joi.number().integer().allow(null),
  sectorId: Joi.number().integer().allow(null),
  execution_date: Joi.date().allow(null),
  deviceFingerprint: Joi.string().allow("", null),

  // Delivery Info
  deliveryDates: Joi.array().items(Joi.string().isoDate()).allow(null),
  delivery_date: Joi.alternatives().try(Joi.date(), Joi.string()).allow("", null), // New field
  delivery_city: Joi.string().allow("", null), // New field
  deliveryLocations: Joi.array()
    .items(
      Joi.object({
        city: Joi.string().allow("", null),
        address: Joi.string().allow("", null),
        coordinates: Joi.object().allow(null),
        googleMapLink: Joi.string().allow("", null),
      }),
    )
    .allow(null),

  // Contact Info
  contactNumbers: Joi.array().items(Joi.string().allow("", null)).allow(null),
  contact_number: Joi.string().allow("", null), // New field

  // Settings
  requiresDelivery: Joi.boolean().default(true),
  requiresInstallation: Joi.boolean().default(false),
  hideOffers: Joi.boolean().default(false),
  hidePersonalInfo: Joi.boolean().default(false),

  // Direct Purchase
  directPurchase: Joi.boolean().default(false),
  targetSellerId: Joi.number().integer().allow(null), // New field

  // Types
  post_type: Joi.string()
    .valid("standard", "quick", "direct")
    .default("standard"), // New field
  auction_type: Joi.string().valid("public", "secret").default("public"), // New field

  // Pricing
  price_range_min: Joi.number().allow(null),
  price_range_max: Joi.number().allow(null),
  fixed_price: Joi.number().allow(null),

  // Attachments
  images: Joi.array().items(Joi.string()).allow(null),
  pdfAttachments: Joi.array().items(Joi.string()).allow(null),
  attachments: Joi.array().items(Joi.object()).allow(null),

  // Advanced
  advanced_options: Joi.object().allow(null),
});

const updateRequestSchema = createRequestSchema.fork(["title"], (schema) =>
  schema.optional(),
);

module.exports = {
  createRequestSchema,
  updateRequestSchema,
};
