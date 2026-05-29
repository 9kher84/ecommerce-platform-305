/**
 * Centralized Response Messages
 * Supports multiple languages (ar, en)
 * Organized by category for easy maintenance
 */

const messages = {
  // Arabic Messages
  ar: {
    // ============================================================
    // AUTHENTICATION & AUTHORIZATION
    // ============================================================
    AUTH_REQUIRED: "يجب تسجيل الدخول للوصول إلى هذه الصفحة",
    AUTH_INVALID_CREDENTIALS: "البريد الإلكتروني أو كلمة المرور غير صحيحة",
    AUTH_TOKEN_EXPIRED: "انتهت صلاحية الجلسة، يرجى تسجيل الدخول مرة أخرى",
    AUTH_TOKEN_INVALID: "رمز المصادقة غير صالح",
    AUTH_FORBIDDEN: "ليس لديك صلاحية للوصول إلى هذا المورد",
    AUTH_ADMIN_ONLY: "هذه العملية متاحة للمسؤولين فقط",
    AUTH_SELLER_ONLY: "هذه العملية متاحة للبائعين فقط",
    AUTH_BUYER_ONLY: "هذه العملية متاحة للمشترين فقط",

    // ============================================================
    // VALIDATION ERRORS
    // ============================================================
    VALIDATION_REQUIRED_FIELDS: "الرجاء تقديم جميع الحقول المطلوبة",
    VALIDATION_INVALID_EMAIL: "البريد الإلكتروني غير صالح",
    VALIDATION_INVALID_PASSWORD: "كلمة المرور يجب أن تكون 6 أحرف على الأقل",
    VALIDATION_NO_NUMBERS_IN_TITLE: "⛔ يمنع كتابة الأرقام حرفياً في العنوان",
    VALIDATION_NO_NUMBERS_IN_DESC: "⛔ يمنع كتابة الأرقام حرفياً في الوصف",
    VALIDATION_INVALID_CATEGORY: "الفئة المحددة غير صالحة",
    VALIDATION_INVALID_PRICE: "السعر يجب أن يكون رقماً موجباً",

    // ============================================================
    // SUBSCRIPTION & PLANS
    // ============================================================
    PLAN_DIRECT_PURCHASE_REQUIRED: "الشراء المباشر يتطلب خطة أ أو خطة ب",
    PLAN_CONTACT_LIMIT: (tier, max) =>
      `الخطة ${tier} تسمح بـ ${max} رقم تواصل فقط`,
    PLAN_LOCATIONS_PLAN_B: "مواقع التسليم المتعددة تتطلب خطة ب",
    PLAN_IMAGES_REQUIRED: "الصور تتطلب خطة أ أو خطة ب",
    PLAN_PDF_ONE: "الخطة المجانية تسمح بملف PDF واحد فقط",
    PLAN_PDF_PLAN_A: "خطة أ تسمح بملف PDF واحد فقط",
    PLAN_IMAGES_PLAN_A: "خطة أ تسمح بصورة واحدة فقط",
    PLAN_LOC_IMAGES_PLAN_B: (idx) =>
      `الموقع ${idx}: خطة ب تسمح بصورتين فقط لكل موقع`,
    PLAN_LOC_PDF_PLAN_B: (idx) =>
      `الموقع ${idx}: خطة ب تسمح بملف PDF واحد لكل موقع`,
    PLAN_DIRECT_TARGET_REQUIRED:
      "الشراء المباشر من بائع محدد يتطلب خطة أ أو خطة ب",
    PLAN_DIRECT_TARGET_MISSING: "يجب تحديد البائع المستهدف للشراء المباشر",
    PLAN_WEEKLY_LIMIT: (limit, tier) =>
      `تم الوصول للحد الأسبوعي (${limit} طلبات/أسبوع للخطة ${tier})`,

    // ============================================================
    // FRAUD DETECTION
    // ============================================================
    FRAUD_SELF_TRADING: "تم اكتشاف نشاط احتيالي: التداول الذاتي غير مسموح",
    FRAUD_SUSPICIOUS_ACTIVITY: "تم اكتشاف نشاط مشبوه",
    FRAUD_DEVICE_MISMATCH: "تم رفض العملية لأسباب أمنية",

    // ============================================================
    // RESOURCE NOT FOUND
    // ============================================================
    NOT_FOUND_USER: "المستخدم غير موجود",
    NOT_FOUND_REQUEST: "الطلب غير موجود",
    NOT_FOUND_QUOTE: "العرض غير موجود",
    NOT_FOUND_DEAL: "الصفقة غير موجودة",
    NOT_FOUND_PRODUCT: "المنتج غير موجود",
    NOT_FOUND_CATEGORY: "الفئة غير موجودة",
    NOT_FOUND_RESOURCE: "المورد المطلوب غير موجود",

    // ============================================================
    // PAYMENT ERRORS
    // ============================================================
    PAYMENT_FAILED: "فشلت عملية الدفع",
    PAYMENT_INVALID_AMOUNT: "مبلغ الدفع غير صالح",
    PAYMENT_GATEWAY_ERROR: "خطأ في بوابة الدفع",
    PAYMENT_INSUFFICIENT_FUNDS: "رصيد غير كافٍ",
    PAYMENT_SYSTEM_DISABLED:
      "🏛️ نظام الدفع الإلكتروني جاهز وسيُفعّل قريباً بعد استكمال التصاريح الرسمية",

    // ============================================================
    // RATE LIMITING
    // ============================================================
    RATE_LIMIT_EXCEEDED:
      "تم تجاوز الحد المسموح من الطلبات، يرجى المحاولة لاحقاً",
    RATE_LIMIT_LOGIN:
      "تم تجاوز عدد محاولات تسجيل الدخول، يرجى المحاولة بعد قليل",

    // ============================================================
    // DATABASE ERRORS
    // ============================================================
    DB_CONNECTION_ERROR: "خطأ في الاتصال بقاعدة البيانات",
    DB_OPERATION_FAILED: "فشلت عملية قاعدة البيانات",

    // ============================================================
    // EXTERNAL SERVICES
    // ============================================================
    SERVICE_REDIS_UNAVAILABLE: "خدمة Redis غير متاحة حالياً",
    SERVICE_EXTERNAL_ERROR: "خطأ في خدمة خارجية",

    // ============================================================
    // GENERAL ERRORS
    // ============================================================
    INTERNAL_ERROR: "حدث خطأ داخلي في الخادم",
    OPERATION_FAILED: "فشلت العملية",
    INVALID_REQUEST: "طلب غير صالح",

    // ============================================================
    // SUCCESS MESSAGES
    // ============================================================
    SUCCESS_LOGIN: "تم تسجيل الدخول بنجاح",
    SUCCESS_LOGOUT: "تم تسجيل الخروج بنجاح",
    SUCCESS_REGISTER: "تم التسجيل بنجاح",
    SUCCESS_REQUEST_CREATED: "تم إنشاء الطلب بنجاح",
    SUCCESS_QUOTE_SUBMITTED: "تم تقديم العرض بنجاح",
    SUCCESS_OPERATION: "تمت العملية بنجاح",
  },

  // English Messages
  en: {
    // ============================================================
    // AUTHENTICATION & AUTHORIZATION
    // ============================================================
    AUTH_REQUIRED: "Authentication required to access this resource",
    AUTH_INVALID_CREDENTIALS: "Invalid email or password",
    AUTH_TOKEN_EXPIRED: "Session expired, please login again",
    AUTH_TOKEN_INVALID: "Invalid authentication token",
    AUTH_FORBIDDEN: "You do not have permission to access this resource",
    AUTH_ADMIN_ONLY: "This operation is only available to administrators",
    AUTH_SELLER_ONLY: "This operation is only available to sellers",
    AUTH_BUYER_ONLY: "This operation is only available to buyers",

    // ============================================================
    // VALIDATION ERRORS
    // ============================================================
    VALIDATION_REQUIRED_FIELDS: "Please provide all required fields",
    VALIDATION_INVALID_EMAIL: "Invalid email address",
    VALIDATION_INVALID_PASSWORD: "Password must be at least 6 characters",
    VALIDATION_NO_NUMBERS_IN_TITLE: "⛔ Numbers are not allowed in the title",
    VALIDATION_NO_NUMBERS_IN_DESC:
      "⛔ Numbers are not allowed in the description",
    VALIDATION_INVALID_CATEGORY: "Invalid category selected",
    VALIDATION_INVALID_PRICE: "Price must be a positive number",

    // ============================================================
    // SUBSCRIPTION & PLANS
    // ============================================================
    PLAN_DIRECT_PURCHASE_REQUIRED: "Direct purchase requires Plan A or Plan B",
    PLAN_CONTACT_LIMIT: (tier, max) =>
      `${tier} plan allows only ${max} contact numbers`,
    PLAN_LOCATIONS_PLAN_B: "Multiple delivery locations require Plan B",
    PLAN_IMAGES_REQUIRED: "Images require Plan A or Plan B",
    PLAN_PDF_ONE: "Free plan allows only one PDF file",
    PLAN_PDF_PLAN_A: "Plan A allows only one PDF file",
    PLAN_IMAGES_PLAN_A: "Plan A allows only one image",
    PLAN_LOC_IMAGES_PLAN_B: (idx) =>
      `Location ${idx}: Plan B allows only 2 images per location`,
    PLAN_LOC_PDF_PLAN_B: (idx) =>
      `Location ${idx}: Plan B allows only 1 PDF per location`,
    PLAN_DIRECT_TARGET_REQUIRED:
      "Direct purchase from specific seller requires Plan A or Plan B",
    PLAN_DIRECT_TARGET_MISSING:
      "Target seller must be specified for direct purchase",
    PLAN_WEEKLY_LIMIT: (limit, tier) =>
      `Weekly limit reached (${limit} requests/week for ${tier} plan)`,

    // ============================================================
    // FRAUD DETECTION
    // ============================================================
    FRAUD_SELF_TRADING:
      "Fraudulent activity detected: Self-trading is not allowed",
    FRAUD_SUSPICIOUS_ACTIVITY: "Suspicious activity detected",
    FRAUD_DEVICE_MISMATCH: "Operation rejected for security reasons",

    // ============================================================
    // RESOURCE NOT FOUND
    // ============================================================
    NOT_FOUND_USER: "User not found",
    NOT_FOUND_REQUEST: "Request not found",
    NOT_FOUND_QUOTE: "Quote not found",
    NOT_FOUND_DEAL: "Deal not found",
    NOT_FOUND_PRODUCT: "Product not found",
    NOT_FOUND_CATEGORY: "Category not found",
    NOT_FOUND_RESOURCE: "Requested resource not found",

    // ============================================================
    // PAYMENT ERRORS
    // ============================================================
    PAYMENT_FAILED: "Payment failed",
    PAYMENT_INVALID_AMOUNT: "Invalid payment amount",
    PAYMENT_GATEWAY_ERROR: "Payment gateway error",
    PAYMENT_INSUFFICIENT_FUNDS: "Insufficient funds",
    PAYMENT_SYSTEM_DISABLED:
      "🏛️ Electronic payment system is ready and will be activated soon after completing official permits",

    // ============================================================
    // RATE LIMITING
    // ============================================================
    RATE_LIMIT_EXCEEDED: "Too many requests, please try again later",
    RATE_LIMIT_LOGIN: "Too many login attempts, please try again later",

    // ============================================================
    // DATABASE ERRORS
    // ============================================================
    DB_CONNECTION_ERROR: "Database connection error",
    DB_OPERATION_FAILED: "Database operation failed",

    // ============================================================
    // EXTERNAL SERVICES
    // ============================================================
    SERVICE_REDIS_UNAVAILABLE: "Redis service is currently unavailable",
    SERVICE_EXTERNAL_ERROR: "External service error",

    // ============================================================
    // GENERAL ERRORS
    // ============================================================
    INTERNAL_ERROR: "Internal server error occurred",
    OPERATION_FAILED: "Operation failed",
    INVALID_REQUEST: "Invalid request",

    // ============================================================
    // SUCCESS MESSAGES
    // ============================================================
    SUCCESS_LOGIN: "Login successful",
    SUCCESS_LOGOUT: "Logout successful",
    SUCCESS_REGISTER: "Registration successful",
    SUCCESS_REQUEST_CREATED: "Request created successfully",
    SUCCESS_QUOTE_SUBMITTED: "Quote submitted successfully",
    SUCCESS_OPERATION: "Operation completed successfully",
  },
};

/**
 * Get message by key and language
 * @param {string} key - Message key
 * @param {string} lang - Language code (ar, en)
 * @param {Array} params - Parameters for dynamic messages
 * @returns {string} Localized message
 */
function getMessage(key, lang = "ar", ...params) {
  const message = messages[lang]?.[key];

  if (!message) {
    console.warn(`Message key "${key}" not found for language "${lang}"`);
    return key; // Return key if message not found
  }

  // If message is a function, call it with parameters
  if (typeof message === "function") {
    return message(...params);
  }

  return message;
}

module.exports = {
  messages,
  getMessage,
  // Export for backward compatibility
  ar: messages.ar,
  en: messages.en,
};
