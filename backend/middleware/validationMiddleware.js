const Joi = require("joi");

// Helper function for validation
const validateRequest = (schema) => {
  return (req, res, next) => {
    const { error } = schema.validate(req.body, { abortEarly: false });
    if (error) {
      const errors = error.details.map((detail) => detail.message);
      console.log("Validation Errors:", errors); // DEBUG
      return res.status(400).json({
        success: false,
        message: "بيانات الإدخال غير صالحة",
        errors,
      });
    }
    next();
  };
};

// Schemas

// 1. Register
const registerSchema = Joi.object({
  name: Joi.string().min(3).required().messages({
    "string.base": "الاسم يجب أن يكون نصاً",
    "string.min": "الاسم يجب أن يحتوي على 3 أحرف على الأقل",
    "any.required": "الاسم مطلوب",
  }),
  email: Joi.string().email().required().messages({
    "string.email": "البريد الإلكتروني غير صالح",
    "any.required": "البريد الإلكتروني مطلوب",
  }),
  password: Joi.string().min(6).required().messages({
    "string.min": "كلمة المرور يجب أن تكون 6 أحرف على الأقل",
    "any.required": "كلمة المرور مطلوبة",
  }),
  role: Joi.string().valid("buyer", "seller", "marketer").optional(),
  referrer_code: Joi.string().optional().allow(null, ""),
  sectorIds: Joi.array()
    .items(Joi.number().integer().required())
    .min(1)
    .required()
    .messages({
      "array.base": "يجب اختيار قطاع واحد على الأقل",
      "array.min": "يجب اختيار قطاع واحد على الأقل",
      "any.required": "القطاع مطلوب",
    }),
  subscriptionTier: Joi.string().valid("free", "plan_a", "plan_b").optional(),
});

// 2. Login
const loginSchema = Joi.object({
  email: Joi.string().email().required().messages({
    "string.email": "البريد الإلكتروني غير صالح",
    "any.required": "البريد الإلكتروني مطلوب",
  }),
  password: Joi.string().required().messages({
    "any.required": "كلمة المرور مطلوبة",
  }),
});

// 3. Product (Create/Update)
const productSchema = Joi.object({
  name_ar: Joi.string().required().messages({
    "any.required": "اسم المنتج مطلوب",
  }),
  description_ar: Joi.string().optional(),
  price: Joi.number().positive().required().messages({
    "number.base": "السعر يجب أن يكون رقماً",
    "number.positive": "السعر يجب أن يكون أكبر من صفر",
    "any.required": "السعر مطلوب",
  }),
  stock: Joi.number().integer().min(0).required().messages({
    "number.base": "الكمية يجب أن تكون رقماً",
    "number.min": "الكمية لا يمكن أن تكون سالبة",
    "any.required": "الكمية مطلوبة",
  }),
  categoryId: Joi.number().integer().required().messages({
    "any.required": "معرف الفئة مطلوب",
  }),
});

// 4. Update Profile
const updateProfileSchema = Joi.object({
  name: Joi.string().min(3).optional(),
  email: Joi.string().email().optional(),
  password: Joi.string().min(6).optional(),
  phone: Joi.string().optional(),
  address: Joi.string().optional(),
  // Buyer Dashboard Fields
  mobile: Joi.string().allow('', null).optional(),
  businessName: Joi.string().allow('', null).optional(),
  notificationSettings: Joi.object().optional(),
  // Seller Dashboard Fields
  jobTitle: Joi.string().optional(),
  commercialRegister: Joi.string().optional(),
  city: Joi.string().optional(),
});

// 5. Create Post (Buyer Request) - V2
const createPostSchema = Joi.object({
  title: Joi.string().min(5).max(100).required().messages({
    "string.empty": "العنوان مطلوب",
    "string.min": "العنوان يجب أن يكون 5 أحرف على الأقل",
    "string.max": "العنوان يجب ألا يتجاوز 100 حرف",
  }),
  description: Joi.string().min(10).required().messages({
    "string.empty": "الوصف مطلوب",
    "string.min": "الوصف يجب أن يكون 10 أحرف على الأقل",
  }),
  productId: Joi.number().integer().required().messages({
    "any.required": "معرف المنتج مطلوب",
  }),
  quantity: Joi.number().positive().required().messages({
    "number.base": "الكمية يجب أن تكون رقماً",
    "any.required": "الكمية مطلوبة",
  }),
  unit: Joi.string().required().messages({
    "any.required": "الوحدة مطلوبة (مثال: kg, ton)",
  }),
  deliveryDate: Joi.date().greater("now").required().messages({
    "date.greater": "تاريخ التوصيل يجب أن يكون في المستقبل",
    "any.required": "تاريخ التوصيل مطلوب",
  }),
  deliveryLocation: Joi.string().required().messages({
    "any.required": "موقع التوصيل مطلوب",
  }),
  expiryDate: Joi.date().greater("now").optional(),
});

// 6. Update Post
const updatePostSchema = Joi.object({
  title: Joi.string().min(5).max(100).optional(),
  description: Joi.string().min(10).optional(),
  quantity: Joi.number().positive().optional(),
  unit: Joi.string().optional(),
  deliveryDate: Joi.date().greater("now").optional(),
  deliveryLocation: Joi.string().optional(),
  expiryDate: Joi.date().greater("now").optional(),
  status: Joi.string().valid("open", "closed", "expired").optional(),
}).min(1);

// 7. Create Offer
const createOfferSchema = Joi.object({
  amount: Joi.number().precision(2).positive().required().messages({
    "number.positive": "قيمة العرض يجب أن تكون موجبة",
    "any.required": "قيمة العرض مطلوبة",
  }),
  currency: Joi.string().default("SAR").optional(),
  description: Joi.string().optional(),
});

// 8. Update Deal Status
const updateDealStatusSchema = Joi.object({
  status: Joi.string().valid("paid", "delivered").required().messages({
    "any.only": "الحالة يجب أن تكون paid أو delivered",
    "any.required": "الحالة الجديدة مطلوبة",
  }),
});

module.exports = {
  validateRegister: validateRequest(registerSchema),
  validateLogin: validateRequest(loginSchema),
  validateProduct: validateRequest(productSchema),
  validateUpdateProfile: validateRequest(updateProfileSchema),
  validateCreatePost: validateRequest(createPostSchema),
  validateUpdatePost: validateRequest(updatePostSchema),
  validateCreateOffer: validateRequest(createOfferSchema),
  validateUpdateDealStatus: validateRequest(updateDealStatusSchema),
};
