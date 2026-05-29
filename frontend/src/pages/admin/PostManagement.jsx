import React, { useState, useEffect } from "react";
import {
  FileText,
  Archive,
  Trash2,
  AlertTriangle,
  Eye,
  Clock,
  CheckCircle,
  Ban,
  MessageSquare,
  Search,
} from "lucide-react";

const API_URL = "/api/posts";

// دالة محاكاة للانتظار
const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

// دالة مساعدة لعرض العلامة بناءً على حالة المنشور
const getStatusBadge = (status) => {
  const baseStyle =
    "px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full";
  switch (status) {
    case "active":
      return (
        <span
          className={`${baseStyle} bg-green-100 text-green-800 flex items-center`}
        >
          <CheckCircle className="w-3 h-3 ml-1" /> نشط
        </span>
      );
    case "archived":
      return (
        <span
          className={`${baseStyle} bg-blue-100 text-blue-800 flex items-center`}
        >
          <Archive className="w-3 h-3 ml-1" /> مؤرشف
        </span>
      );
    case "blocked":
      return (
        <span
          className={`${baseStyle} bg-red-100 text-red-800 flex items-center`}
        >
          <Ban className="w-3 h-3 ml-1" /> محظور
        </span>
      );
    case "pending":
      return (
        <span
          className={`${baseStyle} bg-yellow-100 text-yellow-800 flex items-center`}
        >
          <Clock className="w-3 h-3 ml-1" /> بانتظار المراجعة
        </span>
      );
    default:
      return (
        <span className={`${baseStyle} bg-gray-100 text-gray-800`}>
          {status}
        </span>
      );
  }
};

const PostManagement = () => {
  // حالة قائمة المنشورات (بيانات وهمية)
  const [posts, setPosts] = useState([
    {
      id: 101,
      title: "شقة فاخرة للبيع في الرياض بموقع استراتيجي",
      userId: 5,
      category: "عقارات",
      status: "active",
      reportsCount: 0,
      createdAt: "2025-11-20",
    },
    {
      id: 102,
      title: "لابتوب جيمنج للبيع (مشكلة في كرت الشاشة)",
      userId: 8,
      category: "إلكترونيات",
      status: "active",
      reportsCount: 3,
      createdAt: "2025-11-18",
    },
    {
      id: 103,
      title: "خدمات تصميم شعارات احترافية",
      userId: 1,
      category: "خدمات",
      status: "blocked",
      reportsCount: 1,
      createdAt: "2025-11-15",
    },
    {
      id: 104,
      title: "سيارة تويوتا كامري موديل 2022",
      userId: 15,
      category: "سيارات",
      status: "archived",
      reportsCount: 0,
      createdAt: "2025-11-01",
    },
  ]);

  // حالات النظام
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");

  const fetchPosts = async () => {
    setIsLoading(true);
    setError(null);
    await delay(500);
    setIsLoading(false);
  };

  useEffect(() => {
    fetchPosts();
  }, [filterStatus]);

  const handleUpdatePostStatus = async (id, newStatus) => {
    const postTitle = posts.find((p) => p.id === id)?.title;
    if (
      !window.confirm(
        `هل أنت متأكد من تغيير حالة المنشور: "${postTitle}" إلى: ${newStatus === "archived" ? "مؤرشف" : "محظور"}؟`,
      )
    ) {
      return;
    }

    setIsLoading(true);
    setError(null);
    await delay(800);

    try {
      const updatedPosts = posts.map((p) =>
        p.id === id ? { ...p, status: newStatus, reportsCount: 0 } : p,
      );

      setPosts(updatedPosts);
      alert(`تم تحديث حالة المنشور #${id} إلى ${newStatus} بنجاح (محاكاة).`);
    } catch (err) {
      setError("فشل في تحديث حالة المنشور. يرجى المحاولة مرة أخرى.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeletePost = async (id) => {
    const postTitle = posts.find((p) => p.id === id)?.title;
    if (
      !window.confirm(
        `تحذير! هل أنت متأكد من حذف المنشور: "${postTitle}" بشكل دائم؟`,
      )
    ) {
      return;
    }

    setIsLoading(true);
    setError(null);
    await delay(800);

    try {
      const updatedPosts = posts.filter((p) => p.id !== id);
      setPosts(updatedPosts);
      alert(`تم حذف المنشور #${id} بنجاح (محاكاة).`);
    } catch (err) {
      setError("فشل في حذف المنشور. يرجى المحاولة مرة أخرى.");
    } finally {
      setIsLoading(false);
    }
  };

  // تصفية المنشورات بناءً على البحث والحالة
  const filteredPosts = posts.filter((post) => {
    const matchesSearch = post.title
      .toLowerCase()
      .includes(searchTerm.toLowerCase());
    const matchesStatus =
      filterStatus === "all" || post.status === filterStatus;
    return matchesSearch && matchesStatus;
  });

  return (
    <div dir="rtl" className="min-h-screen bg-gray-50 p-4 sm:p-8 font-sans">
      <div className="max-w-7xl mx-auto">
        <header className="mb-8">
          <h1 className="text-3xl font-extrabold text-gray-900 flex items-center">
            <FileText className="w-8 h-8 ml-3 text-primary-600" />
            إدارة محتوى المنشورات
          </h1>
          <p className="text-gray-500 mt-2">
            مراجعة المنشورات، فحص البلاغات، واتخاذ الإجراءات اللازمة
            (أرشفة/حظر/حذف) لضمان جودة المحتوى.
          </p>
        </header>

        {error && (
          <div
            className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-xl relative mb-6"
            role="alert"
          >
            <span className="block sm:inline">{error}</span>
          </div>
        )}

        {/* أدوات التصفية والبحث */}
        <div className="bg-white p-6 shadow-xl rounded-2xl border border-gray-100 mb-6 flex flex-col md:flex-row space-y-4 md:space-y-0 md:space-x-4 md:space-x-reverse items-center justify-between">
          <div className="relative w-full md:w-1/3">
            <input
              type="text"
              placeholder="ابحث بالعنوان..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-primary-500 focus:border-primary-500"
            />
            <Search className="w-5 h-5 text-gray-400 absolute right-3 top-1/2 transform -translate-y-1/2" />
          </div>

          <div className="w-full md:w-auto">
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="w-full md:w-48 p-2 border border-gray-300 rounded-lg focus:ring-primary-500 focus:border-primary-500"
            >
              <option value="all">جميع الحالات</option>
              <option value="active">نشط</option>
              <option value="archived">مؤرشف</option>
              <option value="blocked">محظور</option>
            </select>
          </div>
        </div>

        {/* قائمة المنشورات الحالية */}
        <div className="bg-white p-6 shadow-xl rounded-2xl border border-gray-100">
          <h2 className="text-xl font-semibold mb-4 text-gray-800">
            المنشورات ({filteredPosts.length})
          </h2>

          {isLoading && (
            <div className="p-4 text-center text-primary-600">
              جارٍ تحميل المنشورات...
            </div>
          )}

          {filteredPosts.length === 0 && !isLoading ? (
            <p className="text-gray-500 p-4 text-center border-2 border-dashed border-gray-200 rounded-lg">
              لا توجد منشورات تطابق معايير البحث.
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th
                      scope="col"
                      className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider"
                    >
                      العنوان
                    </th>
                    <th
                      scope="col"
                      className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider hidden sm:table-cell"
                    >
                      المستخدم/الفئة
                    </th>
                    <th
                      scope="col"
                      className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider"
                    >
                      الحالة
                    </th>
                    <th
                      scope="col"
                      className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider"
                    >
                      البلاغات
                    </th>
                    <th
                      scope="col"
                      className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider"
                    >
                      الإجراءات
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredPosts.map((post) => (
                    <tr
                      key={post.id}
                      className="hover:bg-primary-50 transition duration-150"
                    >
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 max-w-xs overflow-hidden text-ellipsis">
                        <a
                          href={`/posts/${post.id}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-primary-600 hover:underline flex items-center"
                        >
                          {post.title}
                          <Eye className="w-4 h-4 mr-2 text-gray-400" />
                        </a>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700 hidden sm:table-cell">
                        <div className="flex flex-col text-xs">
                          <span>المستخدم: #{post.userId}</span>
                          <span className="text-gray-500">{post.category}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-center text-sm">
                        {getStatusBadge(post.status)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-center text-sm">
                        <span
                          className={`flex items-center justify-center font-bold ${post.reportsCount > 0 ? "text-red-600" : "text-gray-500"}`}
                        >
                          {post.reportsCount}
                          {post.reportsCount > 0 && (
                            <AlertTriangle className="w-4 h-4 mr-1" />
                          )}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-center text-sm font-medium">
                        <div className="flex justify-center space-x-2 space-x-reverse">
                          <button
                            onClick={() =>
                              alert(
                                `محاكاة: الانتقال إلى صفحة بلاغات المنشور #${post.id}`,
                              )
                            }
                            className="text-primary-600 hover:text-primary-800 p-2 rounded-full hover:bg-primary-100 transition duration-150"
                            title="مراجعة البلاغات"
                            disabled={isLoading || post.reportsCount === 0}
                          >
                            <MessageSquare className="w-5 h-5" />
                          </button>

                          {post.status === "active" && (
                            <button
                              onClick={() =>
                                handleUpdatePostStatus(post.id, "archived")
                              }
                              className="text-blue-600 hover:text-blue-800 p-2 rounded-full hover:bg-blue-100 transition duration-150"
                              title="أرشفة المنشور"
                              disabled={isLoading}
                            >
                              <Archive className="w-5 h-5" />
                            </button>
                          )}

                          {post.status !== "blocked" && (
                            <button
                              onClick={() =>
                                handleUpdatePostStatus(post.id, "blocked")
                              }
                              className="text-yellow-600 hover:text-yellow-800 p-2 rounded-full hover:bg-yellow-100 transition duration-150"
                              title="حظر/تعطيل المنشور"
                              disabled={isLoading}
                            >
                              <Ban className="w-5 h-5" />
                            </button>
                          )}

                          <button
                            onClick={() => handleDeletePost(post.id)}
                            className="text-red-600 hover:text-red-800 p-2 rounded-full hover:bg-red-100 transition duration-150"
                            title="حذف المنشور بشكل دائم"
                            disabled={isLoading}
                          >
                            <Trash2 className="w-5 h-5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        <footer className="mt-8 text-center text-xs text-gray-400">
          <p>لوحة تحكم المسؤول - الإصدار 1.0</p>
        </footer>
      </div>
    </div>
  );
};

export default PostManagement;
