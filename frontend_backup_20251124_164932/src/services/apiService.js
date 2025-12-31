// src/services/apiService.js
// ✅ Updated for V2.0 - Purchase Request System

// دالة مساعدة للـ fetch
const fetchAPI = async (endpoint, options = {}) => {
    try {
        console.log(`🔄 جاري جلب البيانات من: ${endpoint}`);
        const response = await fetch(`${endpoint}`, {
            headers: {
                'Content-Type': 'application/json',
                ...options.headers,
            },
            ...options,
            credentials: 'include', // ضروري لإرسال الكوكيز مع الطلب
        });

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            const errorMessage = errorData.message || `خطأ في الخادم: ${response.status}`;
            const error = new Error(errorMessage);
            error.response = { data: errorData, status: response.status };
            throw error;
        }

        const data = await response.json();
        console.log(`✅ تم جلب البيانات بنجاح من: ${endpoint}`, data);
        return data;
    } catch (error) {
        console.error(`❌ فشل في جلب البيانات من ${endpoint}:`, error);
        throw error;
    }
};

// ============================================================
// AUTHENTICATION APIs
// ============================================================

export const login = async (email, password) => {
    return await fetchAPI('/api/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email, password }),
    });
};

export const register = async (name, email, password, role) => {
    return await fetchAPI('/api/auth/register', {
        method: 'POST',
        body: JSON.stringify({ name, email, password, role }),
    });
};

export const logout = async () => {
    return await fetchAPI('/api/auth/logout');
};

export const getCurrentUser = async () => {
    return await fetchAPI('/api/auth/me');
};

// ============================================================
// PURCHASE REQUEST APIs (NEW SYSTEM)
// ============================================================

// جلب جميع طلبات الشراء (للبائعين - للتصفح)
export const getAllRequests = async (filters = {}) => {
    const queryParams = new URLSearchParams(filters).toString();
    const url = `/api/requests${queryParams ? `?${queryParams}` : ''}`;
    return await fetchAPI(url);
};

// جلب طلبات الشراء الخاصة بي (للمشترين)
export const getMyRequests = async () => {
    return await fetchAPI('/api/requests/my-requests');
};

// جلب طلب شراء محدد
export const getRequestById = async (requestId) => {
    return await fetchAPI(`/api/requests/${requestId}`);
};

// إنشاء طلب شراء جديد
export const createRequest = async (requestData) => {
    return await fetchAPI('/api/requests', {
        method: 'POST',
        body: JSON.stringify(requestData),
    });
};

// تعديل طلب شراء
export const updateRequest = async (requestId, requestData) => {
    return await fetchAPI(`/api/requests/${requestId}`, {
        method: 'PUT',
        body: JSON.stringify(requestData),
    });
};

// نشر طلب شراء (من مسودة إلى منشور)
export const publishRequest = async (requestId) => {
    return await fetchAPI(`/api/requests/${requestId}/publish`, {
        method: 'PATCH',
    });
};

// إلغاء طلب شراء
export const cancelRequest = async (requestId, reason) => {
    return await fetchAPI(`/api/requests/${requestId}/cancel`, {
        method: 'PATCH',
        body: JSON.stringify({ reason }),
    });
};

// ============================================================
// PRICE QUOTE APIs (NEW SYSTEM)
// ============================================================

// جلب عروض الأسعار لطلب معين
export const getRequestQuotes = async (requestId) => {
    return await fetchAPI(`/api/quotes/request/${requestId}`);
};

// جلب عروض الأسعار الخاصة بي (للبائعين)
export const getMyQuotes = async () => {
    return await fetchAPI('/api/quotes/my-quotes');
};

// تقديم عرض سعر
export const submitQuote = async (quoteData) => {
    return await fetchAPI('/api/quotes', {
        method: 'POST',
        body: JSON.stringify(quoteData),
    });
};

// تعديل عرض سعر
export const updateQuote = async (quoteId, quoteData) => {
    return await fetchAPI(`/api/quotes/${quoteId}`, {
        method: 'PUT',
        body: JSON.stringify(quoteData),
    });
};

// قبول عرض سعر (للمشتري)
export const acceptQuote = async (quoteId) => {
    return await fetchAPI(`/api/quotes/${quoteId}/accept`, {
        method: 'PATCH',
    });
};

// رفض عرض سعر (للمشتري)
export const rejectQuote = async (quoteId, reason) => {
    return await fetchAPI(`/api/quotes/${quoteId}/reject`, {
        method: 'PATCH',
        body: JSON.stringify({ reason }),
    });
};

// سحب عرض سعر (للبائع)
export const withdrawQuote = async (quoteId, reason) => {
    return await fetchAPI(`/api/quotes/${quoteId}/withdraw`, {
        method: 'PATCH',
        body: JSON.stringify({ reason }),
    });
};

// بدء مفاوضة
export const negotiateQuote = async (quoteId, proposedPrice, message) => {
    return await fetchAPI(`/api/quotes/${quoteId}/negotiate`, {
        method: 'POST',
        body: JSON.stringify({ proposedPrice, message }),
    });
};

// ============================================================
// DEAL APIs
// ============================================================

// جلب جميع الصفقات
export const getDeals = async () => {
    return await fetchAPI('/api/deals');
};

// جلب صفقة محددة
export const getDealById = async (dealId) => {
    return await fetchAPI(`/api/deals/${dealId}`);
};

// تحديث حالة صفقة
export const updateDealStatus = async (dealId, status) => {
    return await fetchAPI(`/api/deals/${dealId}/status`, {
        method: 'PATCH',
        body: JSON.stringify({ status }),
    });
};

// ============================================================
// RATING APIs
// ============================================================

// إنشاء تقييم
export const createRating = async (dealId, rating, comment) => {
    return await fetchAPI(`/api/deals/${dealId}/ratings`, {
        method: 'POST',
        body: JSON.stringify({ rating, comment }),
    });
};

// ============================================================
// CATEGORY APIs
// ============================================================

// جلب جميع التصنيفات
export const getAllCategories = async () => {
    return await fetchAPI('/api/categories');
};

// ============================================================
// USER APIs
// ============================================================

// جلب جميع المستخدمين (للإدارة)
export const getAllUsers = async () => {
    return await fetchAPI('/api/users/admin/all');
};

// ============================================================
// LEGACY APIs (للتوافق مع الكود القديم)
// ============================================================

// جلب المنشورات القديمة (سيتم إزالتها لاحقاً)
export const getActivePosts = async (filters = {}) => {
    console.warn('⚠️ getActivePosts is deprecated. Use getAllRequests instead.');
    return getAllRequests(filters);
};

export const getPostById = async (postId) => {
    console.warn('⚠️ getPostById is deprecated. Use getRequestById instead.');
    return getRequestById(postId);
};

export const getMyPosts = async () => {
    console.warn('⚠️ getMyPosts is deprecated. Use getMyRequests instead.');
    return getMyRequests();
};

export const getPostOffers = async (postId) => {
    console.warn('⚠️ getPostOffers is deprecated. Use getRequestQuotes instead.');
    return getRequestQuotes(postId);
};

export const createOffer = async (postId, amount) => {
    console.warn('⚠️ createOffer is deprecated. Use submitQuote instead.');
    return submitQuote({
        purchaseRequestId: postId,
        priceType: 'fixed',
        fixedPrice: amount,
        canDeliver: true,
        proposedDates: [new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)]
    });
};

export const acceptOffer = async (offerId) => {
    console.warn('⚠️ acceptOffer is deprecated. Use acceptQuote instead.');
    return acceptQuote(offerId);
};

// ============================================================
// EXPORTS
// ============================================================

const apiService = {
    // Auth
    login,
    register,
    logout,
    getCurrentUser,

    // Purchase Requests (NEW)
    getAllRequests,
    getMyRequests,
    getRequestById,
    createRequest,
    updateRequest,
    publishRequest,
    cancelRequest,

    // Price Quotes (NEW)
    getRequestQuotes,
    getMyQuotes,
    submitQuote,
    updateQuote,
    acceptQuote,
    rejectQuote,
    withdrawQuote,
    negotiateQuote,

    // Deals
    getDeals,
    getDealById,
    updateDealStatus,

    // Ratings
    createRating,

    // Categories
    getAllCategories,

    // Users
    getAllUsers,

    // Legacy (deprecated)
    getActivePosts,
    getPostById,
    getMyPosts,
    getPostOffers,
    createOffer,
    acceptOffer,
};

export default apiService;