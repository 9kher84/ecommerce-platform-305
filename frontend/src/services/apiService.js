// services/apiService.js - Complete API Service
import axios from 'axios';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';

const apiClient = axios.create({
    baseURL: API_BASE_URL,
    timeout: 15000,
    withCredentials: true, // Required for HttpOnly Cookies
    headers: {
        'Content-Type': 'application/json',
    }
});

// Token interceptor removed - we use HttpOnly cookies now
// apiClient.interceptors.request.use(...)

// معالجة الأخطاء
const handleApiError = (error) => {
    if (error.response) {
        const { status, data } = error.response;
        switch (status) {
            case 400:
                throw new Error(data.message || 'طلب غير صحيح');
            case 401:
                localStorage.removeItem('user');
                // localStorage.removeItem('token'); // Token handled by cookie
                window.location.href = '/login';
                throw new Error('انتهت الجلسة، يرجى تسجيل الدخول مرة أخرى');
            case 404:
                throw new Error('لم يتم العثور على البيانات المطلوبة');
            case 500:
                throw new Error('خطأ في الخادم الداخلي');
            default:
                throw new Error(data.message || `خطأ في الخادم: ${status}`);
        }
    } else if (error.request) {
        throw new Error('لا يمكن الاتصال بالخادم');
    } else {
        throw new Error(error.message || 'حدث خطأ غير متوقع');
    }
};

// دالة أساسية للطلبات
const apiRequest = async (method, endpoint, data = null) => {
    try {
        const config = {
            method,
            url: endpoint,
            ...(data && { data })
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
        const userStr = localStorage.getItem('user');
        return userStr ? JSON.parse(userStr) : null;
    } catch (error) {
        console.error('❌ خطأ في تحليل بيانات المستخدم:', error);
        return null;
    }
};

// ============================================================
// 🔥 AUTH API FUNCTIONS
// ============================================================
export const login = async (email, password) => {
    return apiRequest('POST', '/api/auth/login', { email, password });
};

export const logout = () => {
    // localStorage.removeItem('token'); // Token is cookie
    localStorage.removeItem('user');
    window.location.href = '/login';
};

export const getRequestQuotes = async (requestId) => {
    return apiRequest('GET', `/api/requests/${requestId}/quotes`);
};

export const submitQuote = async (requestId, quoteData) => {
    return apiRequest('POST', `/api/requests/${requestId}/quotes`, quoteData);
};

// ============================================================
// 🔥 MARKETPLACE & QUOTES API FUNCTIONS
// ============================================================
export const getMarketplaceRequests = async (filters = {}) => {
    const params = new URLSearchParams();
    Object.keys(filters).forEach(key => {
        if (filters[key]) params.append(key, filters[key]);
    });
    return apiRequest('GET', `/api/requests/published?${params.toString()}`);
};

export const getMyQuotes = async () => {
    return apiRequest('GET', '/api/quotes/my-quotes');
};

export const getMyDeals = async () => {
    return apiRequest('GET', '/api/deals/my-deals');
};

export const acceptQuote = async (quoteId) => {
    return apiRequest('POST', `/api/quotes/${quoteId}/accept`);
};

export const rejectQuote = async (quoteId, reason) => {
    return apiRequest('POST', `/api/quotes/${quoteId}/reject`, { reason });
};

export const negotiateQuote = async (quoteId, proposedPrice, message) => {
    return apiRequest('POST', `/api/quotes/${quoteId}/negotiate`, { proposedPrice, message });
};

export const withdrawQuote = async (quoteId, reason) => {
    return apiRequest('POST', `/api/quotes/${quoteId}/withdraw`, { reason });
};

export const modifyQuote = async (quoteId, quoteData) => {
    return apiRequest('PUT', `/api/quotes/${quoteId}`, quoteData);
};

export const publishRequest = async (requestId) => {
    return apiRequest('POST', `/api/requests/${requestId}/publish`);
};

export const requestModification = async (requestId, reason) => {
    return apiRequest('POST', `/api/requests/${requestId}/request-modification`, { reason });
};

// ============================================================
// 🔥 REQUESTS API FUNCTIONS
// ============================================================
export const getMyRequests = async () => {
    return apiRequest('GET', '/api/requests/my-requests');
};

export const getAllRequests = async (filters = {}) => {
    const params = new URLSearchParams();
    Object.keys(filters).forEach(key => {
        if (filters[key]) params.append(key, filters[key]);
    });
    return apiRequest('GET', `/api/requests?${params.toString()}`);
};

export const getPublishedRequests = async (filters = {}) => {
    const params = new URLSearchParams();
    Object.keys(filters).forEach(key => {
        if (filters[key]) params.append(key, filters[key]);
    });
    return apiRequest('GET', `/api/requests/published?${params.toString()}`);
};

export const createRequest = async (requestData) => {
    return apiRequest('POST', '/api/requests', requestData);
};

export const getRequestById = async (requestId) => {
    return apiRequest('GET', `/api/requests/${requestId}`);
};

export const editRequest = async (requestId, requestData) => {
    return apiRequest('PUT', `/api/requests/${requestId}`, requestData);
};

export const cancelRequest = async (requestId) => {
    return apiRequest('DELETE', `/api/requests/${requestId}`);
};

// ============================================================
// 🔥 DEALS API FUNCTIONS
// ============================================================
export const getDeals = async () => {
    return apiRequest('GET', '/api/deals');
};

export const updateDealStatus = async (dealId, status) => {
    return apiRequest('PATCH', `/api/deals/${dealId}/status`, { status });
};

// ============================================================
// 🔥 CATEGORIES API FUNCTIONS
// ==========================================================
export const getAllCategories = async () => {
    return apiRequest('GET', '/api/categories');
};

// ============================================================
// 🔥 BUYER DASHBOARD API FUNCTIONS
// ============================================================
export const getUserProfile = async () => {
    return apiRequest('GET', '/api/users/profile');
};

export const updateUserProfile = async (profileData) => {
    return apiRequest('PUT', '/api/users/profile', profileData);
};

export const getBuyerStats = async () => {
    return apiRequest('GET', '/api/dashboard/buyer/stats');
};

export const getBuyerInvoices = async () => {
    return apiRequest('GET', '/api/dashboard/buyer/invoices');
};

export const repostRequest = async (requestId) => {
    return apiRequest('POST', `/api/requests/${requestId}/repost`);
};

// ============================================================
// 🔥 SELLER DASHBOARD API FUNCTIONS
// ============================================================
export const getSellerStats = async () => {
    return apiRequest('GET', '/api/dashboard/seller/stats');
};

export const getSellerInvoices = async () => {
    return apiRequest('GET', '/api/dashboard/seller/invoices');
};

// ============================================================
// 🔥 PRODUCT/INVENTORY API FUNCTIONS
// ============================================================
export const getProducts = async () => {
    return apiRequest('GET', '/api/products');
};

export const addProduct = async (productData) => {
    return apiRequest('POST', '/api/products', productData);
};

export const updateProduct = async (productId, productData) => {
    return apiRequest('PUT', `/api/products/${productId}`, productData);
};

export const deleteProduct = async (productId) => {
    return apiRequest('DELETE', `/api/products/${productId}`);
};

// ============================================================
// 🔥 DEFAULT EXPORT
// ============================================================
const apiService = {
    // المصادقة
    login,
    logout,
    getCurrentUser,

    // الملف الشخصي ولوحة التحكم
    getUserProfile,
    updateUserProfile,
    getBuyerStats,
    getBuyerInvoices,
    getSellerStats,
    getSellerInvoices,

    // المنتجات (Seller Inventory)
    getProducts,
    addProduct,
    updateProduct,
    deleteProduct,

    // الطلبات (Requests)
    getMarketplaceRequests,
    getMyQuotes,
    getMyDeals,
    acceptQuote,
    rejectQuote,
    negotiateQuote,
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

    // التوافق مع الكود القديم (Aliases for Posts)
    getAllPosts: getAllRequests,
    getPostById: getRequestById,
    createPost: createRequest,
    updatePost: editRequest,
    deletePost: cancelRequest,

    // الصفقات
    getDeals,
    updateDealStatus,

    // التصنيفات
    getAllCategories,

    // الدوال المساعدة
    _helpers: {
        handleApiError
    }
};

export default apiService;