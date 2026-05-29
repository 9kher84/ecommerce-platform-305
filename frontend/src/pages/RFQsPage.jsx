import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import {
  Loader2,
  Search,
  Filter,
  Calendar,
  MapPin,
  ChevronRight,
  Package,
  AlertCircle,
  Info,
} from "lucide-react";
import apiService from "../services/apiService";

const RFQsPage = () => {
  const [rfqs, setRfqs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [categories, setCategories] = useState([]);

  const [pagination, setPagination] = useState({
    currentPage: 1,
    totalPages: 1,
  });
  const [page, setPage] = useState(1);

  const fetchRFQs = async (currentPage = 1) => {
    setLoading(true);
    try {
      const response = await apiService.getPublishedRequests(null, {
        status: "rfq_published",
        page: currentPage,
        limit: 9,
        search: searchTerm,
        categoryId: selectedCategory !== "all" ? selectedCategory : null,
      });

      const data = response.data || response;
      setRfqs(data.requests || data || []);
      if (data.pagination) {
        setPagination(data.pagination);
      }
    } catch (error) {
      console.error("Error fetching RFQs:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCategories();
  }, []);

  useEffect(() => {
    fetchRFQs(page);
  }, [page, selectedCategory]);

  const handleSearch = (e) => {
    e.preventDefault();
    setPage(1);
    fetchRFQs(1);
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-6xl mx-auto">
        <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">
              طلبات العروض (RFQs)
            </h1>
            <p className="text-gray-500 mt-1">
              تصفح أحدث طلبات الشراء المفتوحة وقم بتقديم عروضك
            </p>
          </div>
        </div>

        {/* Filters Section */}
        <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 mb-8 flex flex-col md:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              placeholder="بحث عن طلب..."
              className="w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 transition-all"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <div className="flex gap-2">
            <select
              className="p-2 border rounded-lg bg-white focus:ring-2 focus:ring-indigo-500"
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
            >
              <option value="all">كل التصنيفات</option>
              {categories.map((cat) => (
                <option key={cat.id} value={cat.id}>
                  {cat.name_ar}
                </option>
              ))}
            </select>
            <button
              onClick={fetchRFQs}
              className="bg-gray-100 p-2 rounded-lg hover:bg-gray-200"
            >
              <Filter className="w-5 h-5 text-gray-600" />
            </button>
          </div>
        </div>

        {loading ? (
          <div className="flex flex-col items-center justify-center py-20">
            <Loader2 className="w-12 h-12 animate-spin text-indigo-600 mb-4" />
            <p className="text-gray-500">جاري تحميل الطلبات...</p>
          </div>
        ) : filteredRFQs.length === 0 ? (
          <div className="bg-white p-20 rounded-2xl shadow-sm text-center border-2 border-dashed border-gray-200">
            <Package className="w-20 h-20 mx-auto text-gray-200 mb-6" />
            <h3 className="text-xl font-bold text-gray-900">
              لا توجد طلبات عروض حالياً
            </h3>
            <p className="text-gray-500 mt-2">
              جرب البحث بكلمات أخرى أو اختر تصنيفاً مختلفاً
            </p>
            <button
              onClick={() => {
                setSearchTerm("");
                setSelectedCategory("all");
              }}
              className="mt-6 text-indigo-600 font-medium hover:underline"
            >
              إعادة ضبط البحث
            </button>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {rfqs.map((rfq) => (
                // ... (keeping existing card mapping, just using rfqs instead of filteredRFQs)
                <div
                  key={rfq.id}
                  className="bg-white rounded-2xl shadow-sm border border-gray-100 hover:shadow-md transition-all group overflow-hidden"
                >
                  <div className="p-6">
                    <div className="flex justify-between items-start mb-4">
                      <span className="bg-indigo-50 text-indigo-700 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider">
                        {rfq.category?.name_ar || "تصنيف عام"}
                      </span>
                      <div className="flex items-center text-gray-400 text-xs">
                        <Calendar className="w-3.5 h-3.5 mr-1" />
                        {new Date(rfq.createdAt).toLocaleDateString("ar-SA")}
                      </div>
                    </div>

                    <h3 className="text-xl font-bold text-gray-900 mb-2 group-hover:text-indigo-600 transition-colors">
                      {rfq.title}
                    </h3>

                    <p className="text-gray-600 text-sm line-clamp-2 mb-6 min-h-[40px]">
                      {rfq.description || "لا يوجد وصف متاح لهذا الطلب."}
                    </p>

                    <div className="grid grid-cols-2 gap-4 mb-6">
                      <div className="bg-gray-50 p-3 rounded-xl">
                        <span className="text-xs text-gray-500 block">
                          الكمية المطلوبة
                        </span>
                        <span className="text-lg font-bold text-gray-900">
                          {rfq.quantity} {rfq.unit}
                        </span>
                      </div>
                      <div className="bg-gray-50 p-3 rounded-xl">
                        <span className="text-xs text-gray-500 block">
                          تاريخ التسليم
                        </span>
                        <span className="text-lg font-bold text-gray-900">
                          {rfq.delivery_date
                            ? new Date(rfq.delivery_date).toLocaleDateString(
                                "ar-SA",
                              )
                            : "مرن"}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center text-gray-500 text-sm mb-6">
                      <MapPin className="w-4 h-4 mr-1 text-gray-400" />
                      <span>
                        توصيل إلى:{" "}
                        {rfq.deliveryLocations?.[0]?.city || "أنحاء المملكة"}
                      </span>
                    </div>

                    <Link
                      to={`/submit-quote/${rfq.id}`}
                      className="w-full bg-gray-900 text-white py-3 rounded-xl font-bold flex items-center justify-center group-hover:bg-indigo-600 transition-all hover:scale-[1.02] active:scale-[0.98]"
                    >
                      تقديم عرض سعر
                      <ChevronRight className="w-5 h-5 ml-2" />
                    </Link>
                  </div>

                  <div className="px-6 py-3 bg-gray-50 border-t flex items-center justify-between">
                    <div className="flex -space-x-2 overflow-hidden">
                      <div className="inline-block h-6 w-6 rounded-full bg-gray-300 border-2 border-white ring-2 ring-gray-100"></div>
                      <div className="inline-block h-6 w-6 rounded-full bg-gray-400 border-2 border-white ring-2 ring-gray-100"></div>
                    </div>
                    <span className="text-xs text-gray-500">
                      تم تقديم {rfq.quotesCount || 0} عروض
                    </span>
                  </div>
                </div>
              ))}
            </div>

            {/* Pagination */}
            {pagination.totalPages > 1 && (
              <div className="flex justify-center mt-10 gap-2">
                {Array.from(
                  { length: pagination.totalPages },
                  (_, i) => i + 1,
                ).map((pageNum) => (
                  <button
                    key={pageNum}
                    onClick={() => setPage(pageNum)}
                    className={`w-10 h-10 rounded-lg font-bold transition-all ${
                      page === pageNum
                        ? "bg-indigo-600 text-white shadow-lg"
                        : "bg-white text-gray-600 hover:bg-gray-100 border"
                    }`}
                  >
                    {pageNum}
                  </button>
                ))}
              </div>
            )}
          </>
        )}

        {/* Info Box */}
        <div className="mt-12 bg-indigo-50 border border-indigo-100 rounded-2xl p-6 flex items-start gap-4">
          <Info className="w-6 h-6 text-indigo-600 shrink-0 mt-1" />
          <div>
            <h4 className="font-bold text-indigo-900">نصيحة للبائع</h4>
            <p className="text-indigo-700 text-sm mt-1">
              احرص على تقديم سعر منافس ومواصفات دقيقة لتزيد من فرص قبول عرضك.
              المشتري يقدر الجودة وسرعة التوصيل بقدر ما يقدر السعر.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RFQsPage;
