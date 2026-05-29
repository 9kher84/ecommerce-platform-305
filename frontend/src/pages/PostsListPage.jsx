import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Loader2, Plus, Edit, Trash2, Eye } from "lucide-react";
import apiService from "../services/apiService";
import { useAuth } from "../hooks/useAuth";

// ----------------------------------------------------------------------
// مكون البطاقة للمنشور
// ----------------------------------------------------------------------
const PostCard = ({ post, isOwner, onNavigate }) => {
  const formattedDate = new Date(post.expiryDate).toLocaleDateString("ar-EG");
  const highestOffer = post.currentHighestOffer || post.startingPrice;
  const isActive =
    post.status === "active" && new Date(post.expiryDate) > new Date();

  return (
    <div className="bg-white rounded-lg shadow-md hover:shadow-xl transition-shadow duration-300 overflow-hidden">
      {/* عرض الصورة الأولى إذا وجدت */}
      <img
        src={
          post.images?.[0] ||
          "https://placehold.co/400x250/6366f1/ffffff?text=Product+Image"
        }
        alt={post.title}
        className="w-full h-48 object-cover"
      />
      <div className="p-4">
        <h3
          className="text-xl font-bold text-gray-800 hover:text-indigo-600 transition-colors cursor-pointer"
          onClick={() => onNavigate(`/posts/${post.id}`)}
        >
          {post.title}
        </h3>
        <p className="text-sm text-gray-500 mt-1 line-clamp-2">
          {post.description}
        </p>

        <div className="mt-4 flex justify-between items-center">
          <div>
            <p className="text-xs text-gray-500">أعلى عرض حالي:</p>
            <p className="text-lg font-extrabold text-green-600">
              {parseFloat(highestOffer).toFixed(2)} ريال
            </p>
          </div>
          <div className="text-right">
            <p className="text-xs text-gray-500">ينتهي في:</p>
            <p className="text-sm font-semibold text-red-500">
              {formattedDate}
            </p>
          </div>
        </div>

        {/* حالة المنشور */}
        <div className="mt-3">
          <span
            className={`inline-block px-3 py-1 text-xs font-semibold rounded-full ${
              isActive
                ? "bg-green-100 text-green-800"
                : post.status === "sold"
                  ? "bg-indigo-100 text-indigo-800"
                  : "bg-red-100 text-red-800"
            }`}
          >
            {isActive ? "نشط" : post.status === "sold" ? "مُباع" : "منتهي"}
          </span>
        </div>

        {/* أزرار الإجراءات */}
        <div className="mt-4 flex gap-2">
          {isOwner ? (
            <>
              <button
                onClick={() => onNavigate(`/post-manage/${post.id}`)}
                className="flex-1 flex items-center justify-center bg-indigo-600 text-white py-2 rounded-md hover:bg-indigo-700 transition-colors text-sm"
              >
                <Edit className="w-4 h-4 ml-1" />
                إدارة العروض
              </button>
              <button
                onClick={() => onNavigate(`/posts/${post.id}`)}
                className="flex items-center justify-center bg-gray-200 text-gray-700 px-3 py-2 rounded-md hover:bg-gray-300 transition-colors"
              >
                <Eye className="w-4 h-4" />
              </button>
            </>
          ) : (
            <Link
              to={`/posts/${post.id}`}
              className="flex-1 text-center bg-indigo-600 text-white py-2 rounded-md hover:bg-indigo-700 transition-colors"
            >
              شاهد وقدم عرضك
            </Link>
          )}
        </div>
      </div>
    </div>
  );
};

// ----------------------------------------------------------------------
// المكون الرئيسي: قائمة المنشورات
// ----------------------------------------------------------------------
const PostsListPage = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [viewMode, setViewMode] = useState("all"); // 'all' or 'my'

  useEffect(() => {
    const fetchPosts = async () => {
      try {
        setLoading(true);
        setError(null);

        let response;
        if (viewMode === "my" && user) {
          // جلب منشورات المستخدم الحالي
          response = await apiService.getMyPosts();
        } else {
          // جلب جميع المنشورات النشطة
          const filters = {};
          if (searchQuery) filters.search = searchQuery;
          response = await apiService.getActivePosts(filters);
        }

        setPosts(response.data?.posts || []);
      } catch (err) {
        console.error("فشل في جلب المنشورات:", err);
        setError("فشل في تحميل قائمة المنشورات. الرجاء المحاولة لاحقاً.");
      } finally {
        setLoading(false);
      }
    };

    // تأخير بسيط لتجنب الطلبات المتكررة أثناء الكتابة
    const delaySearch = setTimeout(() => {
      fetchPosts();
    }, 300);

    return () => clearTimeout(delaySearch);
  }, [searchQuery, viewMode, user]);

  if (loading)
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
        <span className="text-lg text-indigo-600 mr-3">
          جاري تحميل المنشورات...
        </span>
      </div>
    );

  return (
    <div className="p-4 md:p-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-extrabold text-gray-900 border-b pb-2">
          {viewMode === "my" ? "منشوراتي" : "سوق المزايدات"}
        </h1>

        {user && user.role === "seller" && (
          <div className="flex gap-2">
            <button
              onClick={() => setViewMode(viewMode === "all" ? "my" : "all")}
              className="bg-gray-200 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-300 transition-colors text-sm font-medium"
            >
              {viewMode === "all" ? "منشوراتي" : "كل المنشورات"}
            </button>
          </div>
        )}

        {user && user.role === "buyer" && (
          <Link
            to="/create-post"
            className="flex items-center gap-2 bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 transition-colors text-sm font-bold shadow-md"
          >
            <Plus className="w-5 h-5" />
            إنشاء طلب جديد
          </Link>
        )}
      </div>

      {/* شريط البحث */}
      {viewMode === "all" && (
        <div className="mb-8">
          <input
            type="text"
            placeholder="ابحث بالعنوان..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full p-3 border border-gray-300 rounded-lg focus:ring-indigo-500 focus:border-indigo-500 transition-colors"
            dir="rtl"
          />
        </div>
      )}

      {error ? (
        <div className="text-center p-8 bg-red-50 text-red-600 rounded-lg">
          {error}
        </div>
      ) : posts.length === 0 ? (
        <div className="text-center p-12 bg-gray-50 rounded-lg">
          <p className="text-xl text-gray-600">
            {viewMode === "my"
              ? "لم تقم بإنشاء أي منشورات بعد."
              : "لا توجد منشورات متاحة حالياً."}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {posts.map((post) => (
            <PostCard
              key={post.id}
              post={post}
              isOwner={user && post.sellerId === user.id}
              onNavigate={navigate}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default PostsListPage;
