import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Search, Filter, Package, Clock, Loader2 } from "lucide-react";
import apiService from "../services/apiService";
import { useAuth } from "../hooks/useAuth";

const HomePage = () => {
  const { user } = useAuth();
  const [requests, setRequests] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    categoryId: "",
    searchQuery: "", // Updated to match backend expectation
  });

  useEffect(() => {
    fetchData();
  }, [filters]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [requestsRes, categoriesRes] = await Promise.all([
        apiService.getAllRequests(filters),
        apiService.getAllCategories(),
      ]);

      // 🔥 التحديث هنا: استخدام requestsRes.data بدلاً من requestsRes.requests
      let allRequests = requestsRes.data || [];

      // Apply tier-based limits for free buyers
      if (user?.role === "buyer" && user?.subscriptionTier === "free") {
        allRequests = applyFreeBuyerLimits(allRequests);
      }

      setRequests(allRequests);

      // Fix Category Parsing
      if (categoriesRes.categories) {
        setCategories(categoriesRes.categories);
      } else if (categoriesRes.data && categoriesRes.data.categories) {
        setCategories(categoriesRes.data.categories);
      } else if (Array.isArray(categoriesRes)) {
        setCategories(categoriesRes);
      } else if (categoriesRes.data && Array.isArray(categoriesRes.data)) {
        setCategories(categoriesRes.data);
      }
    } catch (error) {
      console.error("Error fetching data:", error);
    } finally {
      setLoading(false);
    }
  };

  // Apply free buyer browsing limits: 3 requests per category
  const applyFreeBuyerLimits = (allRequests) => {
    const limitedRequests = [];
    const categoryCount = {};

    for (const request of allRequests) {
      const catId = request.categoryId;

      if (!categoryCount[catId]) {
        categoryCount[catId] = 0;
      }

      if (categoryCount[catId] < 3) {
        // Hide createdAt for free buyers
        limitedRequests.push({
          ...request,
          createdAt: null, // Hide date
        });
        categoryCount[catId]++;
      }
    }

    return limitedRequests;
  };

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters((prev) => ({ ...prev, [name]: value }));
  };

  const statusColors = {
    draft: "bg-gray-100 text-gray-800",
    published: "bg-blue-100 text-blue-800",
    negotiating: "bg-yellow-100 text-yellow-800",
    accepted: "bg-green-100 text-green-800",
    completed: "bg-green-600 text-white",
    cancelled: "bg-red-100 text-red-800",
    expired: "bg-gray-300 text-gray-600",
  };

  const statusLabels = {
    draft: "مسودة",
    published: "منشور",
    negotiating: "قيد التفاوض",
    accepted: "مقبول",
    completed: "مكتمل",
    cancelled: "ملغي",
    expired: "منتهي",
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            طلبات الشراء
          </h1>
          <p className="text-gray-600">تصفح طلبات الشراء المتاحة</p>

          {user?.role === "buyer" && user?.subscriptionTier === "free" && (
            <div className="mt-4 bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <p className="text-sm text-yellow-800">
                📢 <strong>ملاحظة:</strong> يمكنك مشاهدة 3 طلبات فقط من كل
                تصنيف. للوصول الكامل، قم بإنشاء طلب شراء خاص بك!
              </p>
            </div>
          )}
        </div>

        {/* Filters */}
        <div className="bg-white rounded-lg shadow-md p-4 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                <Search className="w-4 h-4 inline ml-1" />
                البحث
              </label>
              <input
                type="text"
                name="searchQuery"
                value={filters.searchQuery || ""}
                onChange={handleFilterChange}
                placeholder="ابحث عن طلبات..."
                className="w-full border border-gray-300 rounded-lg p-2 focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                <Filter className="w-4 h-4 inline ml-1" />
                التصنيف
              </label>
              <select
                name="categoryId"
                value={filters.categoryId}
                onChange={handleFilterChange}
                className="w-full border border-gray-300 rounded-lg p-2 focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              >
                <option value="">جميع التصنيفات</option>
                {categories.map((cat) => (
                  <option key={cat.id} value={cat.id}>
                    {cat.name_ar}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Requests Grid */}
        {loading ? (
          <div className="flex justify-center items-center py-20">
            <Loader2 className="w-12 h-12 animate-spin text-indigo-600" />
          </div>
        ) : requests.length === 0 ? (
          <div className="bg-white rounded-lg shadow-md p-12 text-center">
            <Package className="w-16 h-16 mx-auto text-gray-400 mb-4" />
            <p className="text-gray-600 text-lg">لا توجد طلبات شراء متاحة</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {requests.map((request) => (
              <Link
                key={request.id}
                to={`/requests/${request.id}`}
                className="block bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow p-6 border border-gray-200"
              >
                <div className="flex justify-between items-start mb-3">
                  <h3 className="text-lg font-bold text-gray-900 line-clamp-2">
                    {request.title}
                  </h3>
                  <span
                    className={`px-3 py-1 rounded-full text-xs font-semibold ${statusColors[request.status]}`}
                  >
                    {statusLabels[request.status]}
                  </span>
                </div>

                <p className="text-gray-600 text-sm mb-3 line-clamp-2">
                  {request.description}
                </p>

                <div className="flex items-center justify-between text-sm text-gray-500 mb-3">
                  <span className="flex items-center">
                    <Package className="w-4 h-4 ml-1" />
                    {request.quantity} {request.unit}
                  </span>
                  <span className="text-indigo-600 font-semibold">
                    {request.quoteCount || 0} عرض
                  </span>
                </div>

                <div className="pt-3 border-t border-gray-200">
                  {request.createdAt ? (
                    <span className="flex items-center text-xs text-gray-500">
                      <Clock className="w-4 h-4 ml-1" />
                      {new Date(request.createdAt).toLocaleDateString("ar-SA")}
                    </span>
                  ) : (
                    <span className="text-xs text-gray-400 italic">
                      للمزيد من التفاصيل، أنشئ طلب شراء
                    </span>
                  )}
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default HomePage;
