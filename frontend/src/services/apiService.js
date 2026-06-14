// services/apiService.js - Complete API Service (Revised + All Services Connected)
import axios from "axios";

const API_BASE_URL = process.env.REACT_APP_API_URL || "http://localhost:5000";

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 15000,
  withCredentials: true, // Required for HttpOnly Cookies
  headers: {
    "Content-Type": "application/json",
  },
});

// معالجة الأخطاء الموحدة
const handleApiError = (error) => {
  if (error.response) {
    const { status, data } = error.response;
    switch (status) {
      case 400:
        throw new Error(data.message || "طلب غير صحيح");
      case 401:
        localStorage.removeItem("user");
        window.location.href = "/login";
        throw new Error("انتهت الجلسة، يرجى تسجيل الدخول مرة أخرى");
      case 403:
        throw new Error(data.message || "غير مصرح لك بهذا الإجراء");
      case 404:
        throw new Error(data.message || "لم يتم العثور على البيانات المطلوبة");
      case 429:
        throw new Error("طلبات كثيرة جداً، يرجى الانتظار قليلاً");
      case 500:
        throw new Error("خطأ في الخادم الداخلي");
      default:
        throw new Error(data.message || `خطأ في الخادم: ${status}`);
    }
  } else if (error.request) {
    throw new Error("لا يمكن الاتصال بالخادم");
  } else {
    throw new Error(error.message || "حدث خطأ غير متوقع");
  }
};

// دالة أساسية للطلبات
const apiRequest = async (method, endpoint, data = null) => {
  try {
    const config = {
      method,
      url: endpoint,
      ...(data && { data }),
    };
    const response = await apiClient(config);
    return response.data;
  } catch (error) {
    throw handleApiError(error);
  }
};

// الحصول على المستخدم الحالي
const getCurrentUser = () => {
  try {
    const userStr = localStorage.getItem("user");
    return userStr ? JSON.parse(userStr) : null;
  } catch (error) {
    return null;
  }
};

// ============================================================
// 🔐 AUTH API FUNCTIONS
// ============================================================
export const login = async (email, password) => {
  return apiRequest("POST", "/api/auth/login", { email, password });
};

export const register = async (name, email, password, role, sectorIds = [1]) => {
  return apiRequest("POST", "/api/auth/register", { name, email, password, role, sectorIds });
};

export const logout = async () => {
  return apiRequest("POST", "/api/auth/logout");
};

// ============================================================
// 🛒 REQUESTS API FUNCTIONS
// ============================================================
export const getMyRequests = async () => {
  return apiRequest("GET", "/api/requests/my-requests");
};

export const getAllRequests = async (filters = {}) => {
  const params = new URLSearchParams();
  Object.keys(filters).forEach((key) => {
    if (filters[key]) params.append(key, filters[key]);
  });
  return apiRequest("GET", `/api/requests?${params.toString()}`);
};

export const getPublishedRequests = async (filters = {}) => {
  const safeFilters = filters && typeof filters === "object" ? filters : {};
  const params = new URLSearchParams();
  Object.keys(safeFilters).forEach((key) => {
    if (safeFilters[key] !== null && safeFilters[key] !== undefined && safeFilters[key] !== "")
      params.append(key, safeFilters[key]);
  });
  
  const finalUrl = `/api/requests/published?${params.toString()}`;
  const categoryId = safeFilters.categoryId || null;
  const selectedCategory = safeFilters.category || null;
  
  console.log("DEBUG FRONTEND API:", {
    finalUrl,
    selectedCategory,
    categoryId
  });

  return apiRequest("GET", finalUrl);
};

export const getMarketplaceRequests = async (filters = {}) => {
  return getPublishedRequests(filters);
};

export const createRequest = async (requestData) => {
  return apiRequest("POST", "/api/requests", requestData);
};

export const getRequestById = async (requestId) => {
  return apiRequest("GET", `/api/requests/${requestId}`);
};

export const editRequest = async (requestId, requestData) => {
  return apiRequest("PUT", `/api/requests/${requestId}`, requestData);
};

export const cancelRequest = async (requestId) => {
  return apiRequest("DELETE", `/api/requests/${requestId}`);
};

export const publishRequest = async (requestId, data = {}) => {
  return apiRequest("POST", `/api/requests/${requestId}/publish`, data);
};

export const requestModification = async (requestId, reason) => {
  return apiRequest("POST", `/api/requests/${requestId}/request-modification`, {
    reason,
  });
};

export const repostRequest = async (requestId) => {
  return apiRequest("POST", `/api/requests/${requestId}/repost`);
};

export const getRequestQuotes = async (requestId) => {
  return apiRequest("GET", `/api/requests/${requestId}/quotes`);
};

export const submitQuote = async (requestId, quoteData) => {
  return apiRequest("POST", `/api/requests/${requestId}/quotes`, quoteData);
};

export const getRequestStatusHistory = async (requestId) => {
  return apiRequest("GET", `/api/requests/${requestId}/status-history`);
};

export const getAllowedStatuses = async (requestId) => {
  return apiRequest("GET", `/api/requests/${requestId}/allowed-statuses`);
};

export const getPriceRadar = async (requestId) => {
  return apiRequest("GET", `/api/requests/${requestId}/price-radar`);
};

// ============================================================
// 💰 QUOTES API FUNCTIONS
// ============================================================
export const getMyQuotes = async () => {
  return apiRequest("GET", "/api/quotes/my-quotes");
};

export const acceptQuote = async (quoteId) => {
  return apiRequest("POST", `/api/quotes/${quoteId}/accept`);
};

export const rejectQuote = async (quoteId, reason) => {
  return apiRequest("POST", `/api/quotes/${quoteId}/reject`, { reason });
};

export const negotiateQuote = async (quoteId, proposedPrice, message) => {
  return apiRequest("POST", `/api/quotes/${quoteId}/negotiate`, {
    proposedPrice,
    message,
  });
};

// ✅ إصلاح: كانت غير موجودة في apiService
export const respondToNegotiation = async (quoteId, data) => {
  return apiRequest("POST", `/api/quotes/${quoteId}/respond`, data);
};

export const withdrawQuote = async (quoteId, reason) => {
  return apiRequest("POST", `/api/quotes/${quoteId}/withdraw`, { reason });
};

// ✅ إصلاح: المسار الصحيح هو /modify وليس مجرد /:id
export const modifyQuote = async (quoteId, quoteData) => {
  return apiRequest("PUT", `/api/quotes/${quoteId}/modify`, quoteData);
};

export const makeQuoteDecision = async (quoteId, status, buyerNotes = "") => {
  return apiRequest("POST", `/api/quotes/${quoteId}/decision`, {
    status,
    buyerNotes,
  });
};

// ============================================================
// 🤝 DEALS API FUNCTIONS
// ============================================================
export const getDeals = async (params = {}) => {
  const query = new URLSearchParams(params).toString();
  return apiRequest("GET", `/api/deals${query ? `?${query}` : ""}`);
};

export const getMyDeals = async (params = {}) => {
  return getDeals(params);
};

export const getDealById = async (dealId) => {
  return apiRequest("GET", `/api/deals/${dealId}`);
};

export const updateDealStatus = async (dealId, status) => {
  return apiRequest("PATCH", `/api/deals/${dealId}/status`, { status });
};

// ============================================================
// 💳 PAYMENT API FUNCTIONS (جديد - مربوط الآن)
// ============================================================
export const initiatePayment = async (
  dealId,
  paymentMethodId,
  gateway = "test",
) => {
  return apiRequest("POST", "/api/payments/initiate", {
    dealId,
    paymentMethodId,
    gateway,
  });
};

export const getPaymentStatus = async (dealId) => {
  return apiRequest("GET", `/api/payments/status/${dealId}`);
};

export const getPaymentHistory = async () => {
  return apiRequest("GET", "/api/payments/history");
};

export const getPaymentMethods = async () => {
  return apiRequest("GET", "/api/payments/methods");
};

export const addPaymentMethod = async (methodData) => {
  return apiRequest("POST", "/api/payments/methods", methodData);
};

// ============================================================
// 📦 PRODUCTS API FUNCTIONS
// ============================================================
export const getProducts = async () => {
  return apiRequest("GET", "/api/products");
};

export const addProduct = async (productData) => {
  return apiRequest("POST", "/api/products", productData);
};

export const updateProduct = async (productId, productData) => {
  return apiRequest("PUT", `/api/products/${productId}`, productData);
};

export const deleteProduct = async (productId) => {
  return apiRequest("DELETE", `/api/products/${productId}`);
};

// ✅ جديد - رفع منتجات دفعي
export const bulkProductUpload = async (products) => {
  return apiRequest("POST", "/api/products/bulk", { products });
};

export const confirmBulkProducts = async (bulkId) => {
  return apiRequest("POST", "/api/products/bulk/confirm", { bulkId });
};

export const uploadProductFile = async (formData) => {
  try {
    const response = await apiClient({
      method: "POST",
      url: "/api/products/upload",
      data: formData,
      headers: { "Content-Type": "multipart/form-data" },
    });
    return response.data;
  } catch (error) {
    throw handleApiError(error);
  }
};

// ============================================================
// 🔔 NOTIFICATIONS API FUNCTIONS (جديد - مربوط الآن)
// ============================================================
export const getNotifications = async (params = {}) => {
  const query = new URLSearchParams(params).toString();
  return apiRequest("GET", `/api/notifications${query ? `?${query}` : ""}`);
};

export const markNotificationRead = async (notificationId) => {
  return apiRequest("PATCH", `/api/notifications/${notificationId}/read`);
};

export const markAllNotificationsRead = async () => {
  return apiRequest("PATCH", "/api/notifications/read-all");
};

export const getUnreadCount = async () => {
  return apiRequest("GET", "/api/notifications/unread-count");
};

// ============================================================
// ⭐ RATINGS API FUNCTIONS (جديد - مربوط الآن)
// ============================================================
export const submitRating = async (dealId, rating, comment) => {
  return apiRequest("POST", "/api/ratings", { dealId, rating, comment });
};

export const getUserRatings = async (userId) => {
  return apiRequest("GET", `/api/ratings/user/${userId}`);
};

// ============================================================
// 💬 CHAT API FUNCTIONS (جديد - مربوط الآن)
// ============================================================
export const getChatHistory = async (requestId) => {
  return apiRequest("GET", `/api/chat/${requestId}`);
};

// ============================================================
// 🗂️ CATEGORIES API FUNCTIONS
// ============================================================
export const getAllCategories = async () => {
  return apiRequest("GET", "/api/categories");
};

// ============================================================
// 👤 USER PROFILE API FUNCTIONS
// ============================================================
export const getUserProfile = async () => {
  return apiRequest("GET", "/api/users/profile");
};

export const updateUserProfile = async (profileData) => {
  return apiRequest("PUT", "/api/users/profile", profileData);
};

// ============================================================
// 📊 DASHBOARD API FUNCTIONS
// ============================================================
export const getBuyerStats = async () => {
  return apiRequest("GET", "/api/dashboard/buyer/stats");
};

export const getBuyerInvoices = async () => {
  return apiRequest("GET", "/api/dashboard/buyer/invoices");
};

export const getSellerStats = async () => {
  return apiRequest("GET", "/api/dashboard/seller/stats");
};

export const getSellerInvoices = async () => {
  return apiRequest("GET", "/api/dashboard/seller/invoices");
};

// ============================================================
// 🏪 DEFAULT EXPORT — كل الخدمات مجمعة
// ============================================================
const apiService = {
  login,
  logout,
  getCurrentUser,

  // الملف الشخصي
  getUserProfile,
  updateUserProfile,
  getBuyerStats,
  getBuyerInvoices,
  getSellerStats,
  getSellerInvoices,

  // المنتجات
  getProducts,
  addProduct,
  updateProduct,
  deleteProduct,
  bulkProductUpload,
  confirmBulkProducts,
  uploadProductFile,

  // الطلبات
  getMarketplaceRequests,
  getMyQuotes,
  getMyDeals,
  acceptQuote,
  rejectQuote,
  negotiateQuote,
  respondToNegotiation,
  withdrawQuote,
  modifyQuote,
  publishRequest,
  requestModification,
  getMyRequests,
  getAllRequests,
  getPublishedRequests,
  createRequest,
  getRequestById,
  editRequest,
  cancelRequest,
  repostRequest,
  getRequestQuotes,
  submitQuote,
  makeQuoteDecision,
  getRequestStatusHistory,
  getAllowedStatuses,
  getPriceRadar,

  // التوافق مع الكود القديم
  getAllPosts: getAllRequests,
  getPostById: getRequestById,
  createPost: createRequest,
  updatePost: editRequest,
  deletePost: cancelRequest,

  // الصفقات
  getDeals,
  getDealById,
  updateDealStatus,

  // الدفع
  initiatePayment,
  getPaymentStatus,
  getPaymentHistory,
  getPaymentMethods,
  addPaymentMethod,

  // الإشعارات
  getNotifications,
  markNotificationRead,
  markAllNotificationsRead,
  getUnreadCount,

  // التقييمات
  submitRating,
  getUserRatings,

  // الدردشة
  getChatHistory,

  // التصنيفات
  getAllCategories,

  _helpers: { handleApiError },
};

export default apiService;
