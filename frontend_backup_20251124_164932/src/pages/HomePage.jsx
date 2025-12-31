import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Loader2, Tag, Search, MessageSquare, X } from 'lucide-react';
import apiService from '../services/apiService';

// ----------------------------------------------------------------------
// مكونات فرعية (Sub-Components)
// ----------------------------------------------------------------------

const PostCard = ({ post, onNavigateToDetails }) => (
    <div className="bg-white p-5 rounded-xl shadow-lg border border-gray-100 hover:shadow-xl transition duration-300 flex flex-col h-full">
        {/* تفاصيل المنشور */}
        <div className="flex-grow">
            <h3 className="text-xl font-bold text-gray-800 mb-2 hover:text-indigo-600 cursor-pointer"
                onClick={() => onNavigateToDetails(post.id)}>
                {post.title}
            </h3>
            <p className="text-sm text-gray-500 mb-3 line-clamp-2">
                {post.description}
            </p>
            <div className="flex items-center space-x-2 rtl:space-x-reverse text-sm text-indigo-600 mb-4">
                <Tag className="w-4 h-4 flex-shrink-0" />
                <span className="font-medium">{post.Product?.Category?.name_ar || 'تصنيف عام'}</span>
            </div>
        </div>

        {/* السعر وزر التفاصيل */}
        <div className="pt-4 border-t border-gray-100 flex justify-between items-center mt-auto">
            <span className="text-lg font-bold text-green-600">
                {post.startingPrice ? `${parseFloat(post.startingPrice).toLocaleString('ar-EG', { minimumFractionDigits: 0 })} ج.م` : 'عرض مفتوح'}
            </span>
            <button
                onClick={() => onNavigateToDetails(post.id)}
                className="flex items-center text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 px-4 py-2 rounded-lg transition duration-150">
                عرض التفاصيل
            </button>
        </div>
    </div>
);

// ----------------------------------------------------------------------
// المكون الرئيسي: HomePage
// ----------------------------------------------------------------------

const HomePage = () => {
    const navigate = useNavigate();
    const [posts, setPosts] = useState([]);
    const [categories, setCategories] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [selectedCategory, setSelectedCategory] = useState(null);
    const [searchTerm, setSearchTerm] = useState('');

    // دالة جلب البيانات
    const fetchData = useCallback(async () => {
        setLoading(true);
        setError(null);

        try {
            // جلب التصنيفات
            const categoriesData = await apiService.getAllCategories();
            setCategories(categoriesData.data?.categories || []);

            // إعداد فلاتر البحث
            const filters = {};
            if (selectedCategory) filters.categoryId = selectedCategory;
            if (searchTerm) filters.search = searchTerm;

            // جلب المنشورات
            const postsData = await apiService.getActivePosts(filters);
            setPosts(postsData.data?.posts || []);

        } catch (err) {
            console.error("Error fetching data:", err);
            setError("فشل في تحميل البيانات. يرجى المحاولة مرة أخرى.");
        } finally {
            setLoading(false);
        }

    }, [searchTerm, selectedCategory]);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    const handleSearch = (e) => {
        e.preventDefault();
        // التغيير في searchTerm سيؤدي تلقائياً إلى تشغيل fetchData عبر useEffect
    };

    const handleCategorySelect = (categoryId) => {
        const newCategory = selectedCategory === categoryId ? null : categoryId;
        setSelectedCategory(newCategory);
    };

    const handleNavigateToDetails = (postId) => {
        navigate(`/posts/${postId}`);
    };

    // واجهة التحميل
    if (loading && posts.length === 0 && categories.length === 0) {
        return (
            <div className="flex items-center justify-center min-h-[60vh] bg-gray-50 rounded-xl p-8">
                <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
                <span className="text-lg text-indigo-600 mr-3">جاري تحميل المنشورات...</span>
            </div>
        );
    }

    // الواجهة الرئيسية
    return (
        <div className="p-4 md:p-8">
            <h1 className="text-4xl font-extrabold text-gray-900 mb-6 border-b pb-2">اكتشف أحدث المنشورات</h1>

            {/* شريط البحث والتصفية */}
            <div className="bg-white p-6 rounded-xl shadow-lg mb-8">
                {/* نموذج البحث */}
                <form onSubmit={handleSearch} className="flex items-center space-x-4 rtl:space-x-reverse mb-6">
                    <input
                        type="text"
                        placeholder="ابحث بالعنوان أو الوصف..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="flex-grow p-3 border border-gray-300 rounded-lg focus:ring-indigo-500 focus:border-indigo-500 transition text-right"
                        dir="rtl"
                    />
                    <button type="submit" className="bg-indigo-600 hover:bg-indigo-700 text-white p-3 rounded-lg transition duration-150 flex items-center">
                        <Search className="w-5 h-5 ml-2" />
                        بحث
                    </button>
                    {searchTerm && (
                        <button type="button" onClick={() => setSearchTerm('')} className="bg-gray-200 hover:bg-gray-300 text-gray-700 p-3 rounded-lg transition duration-150">
                            <X className="w-5 h-5" />
                        </button>
                    )}
                </form>

                {/* شريط التصفية حسب التصنيف */}
                <div className="pt-4 border-t border-gray-100">
                    <h3 className="text-lg font-semibold text-gray-700 mb-3">التصنيفات:</h3>
                    <div className="flex flex-wrap gap-2">
                        {/* زر إلغاء التصفية */}
                        <button
                            onClick={() => handleCategorySelect(null)}
                            className={`px-4 py-2 rounded-full text-sm font-medium transition ${!selectedCategory ? 'bg-indigo-600 text-white shadow-md' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}
                        >
                            كل المنشورات
                        </button>
                        {/* أزرار التصنيفات الفعلية */}
                        {categories.map((cat) => (
                            <button
                                key={cat.id}
                                onClick={() => handleCategorySelect(cat.id)}
                                className={`px-4 py-2 rounded-full text-sm font-medium transition ${selectedCategory === cat.id ? 'bg-indigo-600 text-white shadow-md' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}
                            >
                                {cat.name_ar}
                            </button>
                        ))}
                    </div>
                </div>
            </div>

            {/* إحصائيات سريعة */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
                <div className="bg-white p-6 rounded-xl shadow-lg border border-gray-100 text-center">
                    <div className="text-3xl font-bold text-indigo-600 mb-2">{posts.length}</div>
                    <div className="text-gray-600">منشور مطابق</div>
                </div>
                <div className="bg-white p-6 rounded-xl shadow-lg border border-gray-100 text-center">
                    <div className="text-3xl font-bold text-green-600 mb-2">
                        {/* حساب العروض الاقتصادية في البيانات المعروضة حاليًا */}
                        {posts.filter(post => post.startingPrice && parseFloat(post.startingPrice) < 1000).length}
                    </div>
                    <div className="text-gray-600">عروض أقل من 1000 ج.م</div>
                </div>
                <div className="bg-white p-6 rounded-xl shadow-lg border border-gray-100 text-center">
                    <div className="text-3xl font-bold text-purple-600 mb-2">
                        {/* حساب البائعين الفريدين في البيانات المعروضة حاليًا */}
                        {new Set(posts.map(post => post.Seller?.name)).size}
                    </div>
                    <div className="text-gray-600">بائع متميز</div>
                </div>
            </div>

            {/* قائمة المنشورات */}
            {error ? (
                <div className="text-center text-red-600 p-8 bg-red-50 rounded-xl">
                    {error}
                </div>
            ) : posts.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                    {posts.map(post => (
                        <PostCard
                            key={post.id}
                            post={post}
                            onNavigateToDetails={handleNavigateToDetails}
                        />
                    ))}
                </div>
            ) : (
                <div className="p-10 text-center bg-white rounded-xl shadow-lg">
                    <MessageSquare className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-xl font-semibold text-gray-600">
                        {searchTerm || selectedCategory ? 'لم يتم العثور على منشورات مطابقة.' : 'لا توجد منشورات نشطة حاليًا.'}
                    </p>
                    {(searchTerm || selectedCategory) && (
                        <button
                            onClick={() => { setSearchTerm(''); setSelectedCategory(null); }}
                            className="mt-4 text-sm font-medium text-indigo-600 hover:text-indigo-800"
                        >
                            مسح البحث والتصفية
                        </button>
                    )}
                </div>
            )}
        </div>
    );
};

export default HomePage;