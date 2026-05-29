import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import {
  Loader2,
  User,
  Settings,
  BarChart2,
  FileText,
  Bell,
  Package,
  Plus,
  Edit2,
  Trash2,
  AlertCircle,
  TrendingUp,
  TrendingDown,
  Download,
  Share2,
  CheckCircle,
  Clock,
  X,
  DollarSign,
} from "lucide-react";
import apiService from "../services/apiService";
import { useAuth } from "../hooks/useAuth";

// ============================================================
// COMPONENTS
// ============================================================

const StatCard = ({ title, value, icon: Icon, color, trend }) => (
  <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
    <div className="flex items-center justify-between mb-2">
      <div className={`p-3 rounded-full ${color} bg-opacity-10`}>
        <Icon className={`w-6 h-6 ${color.replace("bg-", "text-")}`} />
      </div>
      {trend && (
        <span
          className={`text-sm font-medium ${trend > 0 ? "text-green-600" : "text-red-600"}`}
        >
          {trend > 0 ? (
            <TrendingUp className="w-4 h-4 inline" />
          ) : (
            <TrendingDown className="w-4 h-4 inline" />
          )}
          {Math.abs(trend)}%
        </span>
      )}
    </div>
    <p className="text-gray-500 text-sm">{title}</p>
    <h3 className="text-2xl font-bold text-gray-900 mt-1">{value}</h3>
  </div>
);

const ProductRow = ({ product, onEdit, onDelete }) => (
  <tr className="border-b hover:bg-gray-50 transition-colors">
    <td className="p-4">
      {product.image ? (
        <img
          src={product.image}
          alt={product.name}
          className="w-12 h-12 rounded object-cover"
        />
      ) : (
        <div className="w-12 h-12 rounded bg-gray-200 flex items-center justify-center">
          <Package className="w-6 h-6 text-gray-400" />
        </div>
      )}
    </td>
    <td className="p-4 font-medium text-gray-900">{product.name}</td>
    <td className="p-4 text-gray-600">
      {product.category?.name_ar || "غير محدد"}
    </td>
    <td className="p-4 text-gray-600">
      {product.stockLevel} {product.unit}
    </td>
    <td className="p-4">
      <span
        className={`px-2 py-1 rounded text-xs ${product.stockLevel < product.lowStockThreshold ? "bg-red-100 text-red-800" : "bg-green-100 text-green-800"}`}
      >
        {product.stockLevel < product.lowStockThreshold ? "منخفض" : "متوفر"}
      </span>
    </td>
    <td className="p-4 flex space-x-2">
      <button
        onClick={() => onEdit(product)}
        className="text-blue-600 hover:bg-blue-50 p-2 rounded"
      >
        <Edit2 className="w-4 h-4" />
      </button>
      <button
        onClick={() => onDelete(product.id)}
        className="text-red-600 hover:bg-red-50 p-2 rounded"
      >
        <Trash2 className="w-4 h-4" />
      </button>
    </td>
  </tr>
);

const InvoiceRow = ({ invoice }) => (
  <tr className="border-b hover:bg-gray-50 transition-colors">
    <td className="p-4 font-medium text-gray-900">{invoice.invoiceNumber}</td>
    <td className="p-4 text-gray-600">
      {new Date(invoice.date).toLocaleDateString("ar-SA")}
    </td>
    <td className="p-4 text-gray-900 font-bold">{invoice.amount} ريال</td>
    <td className="p-4 text-gray-600">{invoice.buyerName}</td>
    <td className="p-4">
      <span
        className={`px-2 py-1 rounded-full text-xs ${invoice.status === "paid" ? "bg-green-100 text-green-800" : "bg-yellow-100 text-yellow-800"}`}
      >
        {invoice.status === "paid" ? "مدفوع" : "بانتظار الدفع"}
      </span>
    </td>
    <td className="p-4 flex space-x-2">
      <button className="text-gray-500 hover:text-indigo-600" title="تحميل">
        <Download className="w-5 h-5" />
      </button>
      <button className="text-gray-500 hover:text-indigo-600" title="مشاركة">
        <Share2 className="w-5 h-5" />
      </button>
    </td>
  </tr>
);

// ============================================================
// PRODUCT MODAL
// ============================================================

const ProductModal = ({ isOpen, onClose, onSave, product, categories }) => {
  const [formData, setFormData] = useState({
    name: "",
    categoryId: "",
    stockLevel: 0,
    unit: "طن",
    specs: "",
    origin: "",
    productionDate: "",
    estimatedPrice: "",
    deliveryTime: "",
    image: "",
  });

  useEffect(() => {
    if (product) {
      setFormData({
        name: product.name || "",
        categoryId: product.categoryId || "",
        stockLevel: product.stockLevel || 0,
        unit: product.unit || "طن",
        specs: product.specs || "",
        origin: product.origin || "",
        productionDate: product.productionDate
          ? product.productionDate.split("T")[0]
          : "",
        estimatedPrice: product.estimatedPrice || "",
        deliveryTime: product.deliveryTime || "",
        image: product.image || "",
      });
    }
  }, [product]);

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave(formData);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-gray-900 bg-opacity-75 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6 border-b flex justify-between items-center sticky top-0 bg-white">
          <h3 className="text-xl font-bold">
            {product ? "تعديل المنتج" : "إضافة منتج جديد"}
          </h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                اسم السلعة *
              </label>
              <input
                type="text"
                required
                value={formData.name}
                onChange={(e) =>
                  setFormData({ ...formData, name: e.target.value })
                }
                className="w-full p-2 border rounded-lg"
                placeholder="مثال: حديد تسليح"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                التصنيف *
              </label>
              <select
                required
                value={formData.categoryId}
                onChange={(e) =>
                  setFormData({ ...formData, categoryId: e.target.value })
                }
                className="w-full p-2 border rounded-lg"
              >
                <option value="">اختر التصنيف</option>
                {categories.map((cat) => (
                  <option key={cat.id} value={cat.id}>
                    {cat.name_ar}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                الكمية المتاحة
              </label>
              <div className="flex space-x-2">
                <input
                  type="number"
                  value={formData.stockLevel}
                  onChange={(e) =>
                    setFormData({ ...formData, stockLevel: e.target.value })
                  }
                  className="flex-1 p-2 border rounded-lg"
                />
                <select
                  value={formData.unit}
                  onChange={(e) =>
                    setFormData({ ...formData, unit: e.target.value })
                  }
                  className="w-24 p-2 border rounded-lg"
                >
                  <option value="طن">طن</option>
                  <option value="كيس">كيس</option>
                  <option value="لتر">لتر</option>
                  <option value="متر">متر</option>
                </select>
              </div>
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                المواصفات/النوع
              </label>
              <textarea
                value={formData.specs}
                onChange={(e) =>
                  setFormData({ ...formData, specs: e.target.value })
                }
                className="w-full p-2 border rounded-lg"
                rows="2"
                placeholder="مثال: درجة الحديد، نوع الطوب"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                المنشأ
              </label>
              <input
                type="text"
                value={formData.origin}
                onChange={(e) =>
                  setFormData({ ...formData, origin: e.target.value })
                }
                className="w-full p-2 border rounded-lg"
                placeholder="بلد أو مدينة الإنتاج"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                تاريخ الإنتاج
              </label>
              <input
                type="date"
                value={formData.productionDate}
                onChange={(e) =>
                  setFormData({ ...formData, productionDate: e.target.value })
                }
                className="w-full p-2 border rounded-lg"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                السعر التقديري (خاص)
              </label>
              <input
                type="number"
                value={formData.estimatedPrice}
                onChange={(e) =>
                  setFormData({ ...formData, estimatedPrice: e.target.value })
                }
                className="w-full p-2 border rounded-lg"
                placeholder="للحسابات الداخلية فقط"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                مدة التوريد (أيام)
              </label>
              <input
                type="number"
                value={formData.deliveryTime}
                onChange={(e) =>
                  setFormData({ ...formData, deliveryTime: e.target.value })
                }
                className="w-full p-2 border rounded-lg"
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                رابط الصورة
              </label>
              <input
                type="text"
                value={formData.image}
                onChange={(e) =>
                  setFormData({ ...formData, image: e.target.value })
                }
                className="w-full p-2 border rounded-lg"
                placeholder="https://example.com/image.jpg"
              />
            </div>
          </div>

          <div className="flex space-x-3 mt-6">
            <button
              type="submit"
              className="flex-1 bg-indigo-600 text-white py-2 rounded-lg hover:bg-indigo-700"
            >
              حفظ
            </button>
            <button
              type="button"
              onClick={onClose}
              className="flex-1 bg-gray-200 text-gray-800 py-2 rounded-lg hover:bg-gray-300"
            >
              إلغاء
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// ============================================================
// MAIN SELLER DASHBOARD
// ============================================================

const SellerDashboard = () => {
  const { user: authUser } = useAuth();
  const [activeTab, setActiveTab] = useState("account");
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState(null);
  const [stats, setStats] = useState(null);
  const [products, setProducts] = useState([]);
  const [invoices, setInvoices] = useState([]);
  const [categories, setCategories] = useState([]);
  const [quotes, setQuotes] = useState([]);
  const [isEditing, setIsEditing] = useState(false);
  const [productModal, setProductModal] = useState({
    isOpen: false,
    product: null,
  });
  const [formData, setFormData] = useState({});
  const [updateMsg, setUpdateMsg] = useState({ type: "", text: "" });

  useEffect(() => {
    fetchAllData();
  }, []);

  const fetchAllData = async () => {
    setLoading(true);
    try {
      // 1. Profile
      const profileRes = await apiService.getUserProfile();
      setProfile(profileRes.user);
      setFormData({
        name: profileRes.user.name,
        email: profileRes.user.email,
        mobile: profileRes.user.mobile || "",
        businessName: profileRes.user.businessName || "",
        jobTitle: profileRes.user.jobTitle || "",
        commercialRegister: profileRes.user.commercialRegister || "",
        city: profileRes.user.city || "",
        notificationSettings: profileRes.user.notificationSettings || {
          email: true,
          whatsapp: false,
          internal: true,
        },
      });

      // 2. Stats
      const statsRes = await apiService.getSellerStats();
      setStats(statsRes.stats);

      // 3. Products
      const productsRes = await apiService.getProducts();
      setProducts(productsRes.products || []);

      // 4. Invoices
      const invoicesRes = await apiService.getSellerInvoices();
      setInvoices(invoicesRes.invoices || []);

      // 5. Categories
      const categoriesRes = await apiService.getAllCategories();
      setCategories(categoriesRes.data || []);

      // 6. My Quotes
      const quotesRes = await apiService.getMyQuotes();
      setQuotes(quotesRes.data || []);
    } catch (error) {
      console.error("Error fetching dashboard data", error);
    } finally {
      setLoading(false);
    }
  };

  const handleProfileUpdate = async (e) => {
    e.preventDefault();
    setUpdateMsg({ type: "", text: "" });
    try {
      await apiService.updateUserProfile({
        name: formData.name,
        mobile: formData.mobile,
        businessName: formData.businessName,
        jobTitle: formData.jobTitle,
        commercialRegister: formData.commercialRegister,
        city: formData.city,
        notificationSettings: formData.notificationSettings,
      });
      setUpdateMsg({ type: "success", text: "تم تحديث الملف الشخصي بنجاح" });
      setIsEditing(false);
      fetchAllData();
    } catch (error) {
      setUpdateMsg({ type: "error", text: error.message });
    }
  };

  const handleProductSave = async (productData) => {
    try {
      if (productModal.product) {
        await apiService.updateProduct(productModal.product.id, productData);
        alert("تم تحديث المنتج بنجاح");
      } else {
        await apiService.addProduct(productData);
        alert("تم إضافة المنتج بنجاح");
      }
      setProductModal({ isOpen: false, product: null });
      fetchAllData();
    } catch (error) {
      alert(error.message);
    }
  };

  const handleProductDelete = async (productId) => {
    if (!window.confirm("هل أنت متأكد من حذف هذا المنتج؟")) return;
    try {
      await apiService.deleteProduct(productId);
      alert("تم حذف المنتج بنجاح");
      fetchAllData();
    } catch (error) {
      alert(error.message);
    }
  };

  const handleNotificationChange = (type) => {
    setFormData((prev) => ({
      ...prev,
      notificationSettings: {
        ...prev.notificationSettings,
        [type]: !prev.notificationSettings[type],
      },
    }));
  };

  if (loading)
    return (
      <div className="min-h-screen flex justify-center items-center bg-gray-50">
        <Loader2 className="w-12 h-12 animate-spin text-indigo-600" />
      </div>
    );

  const menuItems = [
    { id: "account", label: "بيانات الحساب", icon: User },
    { id: "inventory", label: "إدارة المخزون", icon: Package },
    { id: "quotes", label: "العروض والتفاوض", icon: FileText },
    { id: "stats", label: "الإحصائيات", icon: BarChart2 },
    { id: "notifications", label: "التنبيهات", icon: Bell },
    { id: "invoices", label: "الفواتير", icon: DollarSign },
  ];

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col md:flex-row">
      {/* Sidebar */}
      <aside className="w-full md:w-64 bg-white shadow-md z-10">
        <div className="p-6 border-b">
          <h2 className="text-xl font-bold text-indigo-600">لوحة البائع</h2>
          <p className="text-sm text-gray-500 mt-1">{profile?.name}</p>
          <span className="inline-block px-2 py-1 mt-2 text-xs font-semibold bg-indigo-100 text-indigo-800 rounded-full">
            {profile?.subscriptionTier === "free"
              ? "مجاني"
              : profile?.subscriptionTier === "plan_a"
                ? "خطة أ"
                : "خطة ب"}
          </span>
        </div>
        <nav className="p-4 space-y-2">
          {menuItems.map((item) => (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg transition-colors ${
                activeTab === item.id
                  ? "bg-indigo-50 text-indigo-700 font-medium"
                  : "text-gray-600 hover:bg-gray-50"
              }`}
            >
              <item.icon className="w-5 h-5" />
              <span>{item.label}</span>
            </button>
          ))}
        </nav>
      </aside>

      {/* Main Content */}
      <main className="flex-1 p-6 md:p-10 overflow-y-auto">
        {/* ACCOUNT TAB */}
        {activeTab === "account" && (
          <div className="max-w-3xl mx-auto bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="p-6 border-b flex justify-between items-center bg-gray-50">
              <h2 className="text-lg font-bold text-gray-900">
                بيانات الحساب الأساسية
              </h2>
              {!isEditing && (
                <button
                  onClick={() => setIsEditing(true)}
                  className="text-indigo-600 hover:text-indigo-800 text-sm font-medium"
                >
                  تعديل البيانات
                </button>
              )}
            </div>

            <div className="p-6">
              {updateMsg.text && (
                <div
                  className={`mb-4 p-3 rounded-lg ${updateMsg.type === "success" ? "bg-green-50 text-green-700" : "bg-red-50 text-red-700"}`}
                >
                  {updateMsg.text}
                </div>
              )}

              <form onSubmit={handleProfileUpdate}>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      الاسم التجاري (اختياري)
                    </label>
                    <input
                      type="text"
                      disabled={!isEditing}
                      value={formData.businessName}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          businessName: e.target.value,
                        })
                      }
                      className="w-full p-2 border rounded-lg disabled:bg-gray-100"
                      placeholder="شركة / متجر"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      الاسم أو اللقب *
                    </label>
                    <input
                      type="text"
                      disabled={!isEditing}
                      value={formData.name}
                      onChange={(e) =>
                        setFormData({ ...formData, name: e.target.value })
                      }
                      className="w-full p-2 border rounded-lg disabled:bg-gray-100"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      المسمى الوظيفي (اختياري)
                    </label>
                    <input
                      type="text"
                      disabled={!isEditing}
                      value={formData.jobTitle}
                      onChange={(e) =>
                        setFormData({ ...formData, jobTitle: e.target.value })
                      }
                      className="w-full p-2 border rounded-lg disabled:bg-gray-100"
                    />
                  </div>

                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      البريد الإلكتروني *
                    </label>
                    <input
                      type="email"
                      disabled={true}
                      value={formData.email}
                      className="w-full p-2 border rounded-lg bg-gray-100 text-gray-500 cursor-not-allowed"
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      لا يمكن تغيير البريد مباشرة
                    </p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      رقم الجوال (اختياري)
                    </label>
                    <input
                      type="text"
                      disabled={!isEditing}
                      value={formData.mobile}
                      onChange={(e) =>
                        setFormData({ ...formData, mobile: e.target.value })
                      }
                      placeholder="05xxxxxxxx"
                      className="w-full p-2 border rounded-lg disabled:bg-gray-100"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      رقم السجل التجاري (اختياري)
                    </label>
                    <input
                      type="text"
                      disabled={!isEditing}
                      value={formData.commercialRegister}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          commercialRegister: e.target.value,
                        })
                      }
                      className="w-full p-2 border rounded-lg disabled:bg-gray-100"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      المدينة (اختياري)
                    </label>
                    <input
                      type="text"
                      disabled={!isEditing}
                      value={formData.city}
                      onChange={(e) =>
                        setFormData({ ...formData, city: e.target.value })
                      }
                      className="w-full p-2 border rounded-lg disabled:bg-gray-100"
                    />
                  </div>
                </div>

                <div className="border-t pt-4 grid grid-cols-2 gap-4 text-sm text-gray-500 mb-6">
                  <div>
                    <span className="block font-medium">نوع الاشتراك:</span>
                    {profile?.subscriptionTier === "free"
                      ? "مجاني"
                      : profile?.subscriptionTier === "plan_a"
                        ? "خطة أ"
                        : "خطة ب"}
                  </div>
                  <div>
                    <span className="block font-medium">تاريخ التسجيل:</span>
                    {new Date(profile?.createdAt).toLocaleDateString("ar-SA")}
                  </div>
                  <div>
                    <span className="block font-medium">
                      عدد الصفقات المكتملة:
                    </span>
                    {profile?.completedDealsCount || 0}
                  </div>
                </div>

                {isEditing && (
                  <div className="mt-6 flex space-x-3">
                    <button
                      type="submit"
                      className="bg-indigo-600 text-white px-6 py-2 rounded-lg hover:bg-indigo-700"
                    >
                      حفظ التغييرات
                    </button>
                    <button
                      type="button"
                      onClick={() => setIsEditing(false)}
                      className="bg-gray-200 text-gray-800 px-6 py-2 rounded-lg hover:bg-gray-300"
                    >
                      إلغاء
                    </button>
                  </div>
                )}
              </form>
            </div>
          </div>
        )}

        {/* INVENTORY TAB */}
        {activeTab === "inventory" && (
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-2xl font-bold text-gray-900">
                إدارة المخزون
              </h2>
              <button
                onClick={() => setProductModal({ isOpen: true, product: null })}
                disabled={products.length >= 20}
                className="bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 flex items-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Plus className="w-5 h-5" />
                <span>إضافة منتج ({products.length}/20)</span>
              </button>
            </div>

            {products.length === 0 ? (
              <div className="bg-white p-12 rounded-xl shadow-sm text-center">
                <Package className="w-16 h-16 mx-auto text-gray-300 mb-4" />
                <p className="text-gray-500">لا توجد منتجات في المخزون</p>
              </div>
            ) : (
              <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-right">
                    <thead className="bg-gray-50 text-gray-500 text-sm">
                      <tr>
                        <th className="p-4">الصورة</th>
                        <th className="p-4">اسم السلعة</th>
                        <th className="p-4">التصنيف</th>
                        <th className="p-4">الكمية</th>
                        <th className="p-4">الحالة</th>
                        <th className="p-4">إجراءات</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {products.map((product) => (
                        <ProductRow
                          key={product.id}
                          product={product}
                          onEdit={(p) =>
                            setProductModal({ isOpen: true, product: p })
                          }
                          onDelete={handleProductDelete}
                        />
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        )}

        {/* QUOTES TAB */}
        {activeTab === "quotes" && (
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-2xl font-bold text-gray-900">
                إدارة العروض والتفاوض
              </h2>
              <Link
                to="/rfqs"
                className="bg-indigo-600 text-white px-4 py-2 rounded-lg font-bold hover:bg-indigo-700"
              >
                تصفح طلبات العروض (RFQs)
              </Link>
            </div>

            {quotes.length === 0 ? (
              <div className="bg-white p-12 rounded-xl shadow-sm text-center border border-dashed text-gray-400">
                <FileText className="w-16 h-16 mx-auto mb-4" />
                <p>لم تتقدم بأي عروض أسعار حتى الآن</p>
              </div>
            ) : (
              <div className="grid gap-4">
                {quotes.map((quote) => (
                  <div
                    key={quote.id}
                    className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex justify-between items-center"
                  >
                    <div>
                      <h3 className="font-bold text-gray-900">
                        {quote.request?.title || "طلب غير معروف"}
                      </h3>
                      <div className="flex items-center gap-4 mt-2 text-sm">
                        <span className="text-indigo-600 font-bold">
                          {quote.amount} ريال
                        </span>
                        <span
                          className={`px-2 py-0.5 rounded text-xs ${
                            quote.status === "accepted"
                              ? "bg-green-100 text-green-800"
                              : quote.status === "rejected"
                                ? "bg-red-100 text-red-800"
                                : "bg-blue-100 text-blue-800"
                          }`}
                        >
                          {quote.status === "accepted"
                            ? "مقبول"
                            : quote.status === "rejected"
                              ? "مرفوض"
                              : "قيد الانتظار"}
                        </span>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      {quote.status === "accepted" && (
                        <Link
                          to={`/invoice/${quote.deal?.id}`}
                          className="text-sm font-bold text-indigo-600 hover:bg-indigo-50 px-3 py-1 rounded"
                        >
                          عرض الفاتورة
                        </Link>
                      )}
                      <Link
                        to={`/requests/${quote.purchaseRequestId}`}
                        className="text-sm text-gray-500 hover:bg-gray-50 px-3 py-1 rounded"
                      >
                        عرض الطلب
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* STATS TAB */}
        {activeTab === "stats" && (
          <div className="space-y-6">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">
              الإحصائيات والتحليلات
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <StatCard
                title="إجمالي العروض"
                value={stats?.totalQuotes || 0}
                icon={FileText}
                color="bg-blue-500"
              />
              <StatCard
                title="العروض المقبولة"
                value={stats?.acceptedQuotes || 0}
                icon={CheckCircle}
                color="bg-green-500"
              />
              <StatCard
                title="نسبة الفوز"
                value={`${stats?.winRate || 0}%`}
                icon={TrendingUp}
                color="bg-purple-500"
              />
              <StatCard
                title="متوسط أسعاري"
                value={`${stats?.avgQuotePrice || 0} ريال`}
                icon={DollarSign}
                color="bg-indigo-500"
              />
            </div>

            {stats?.priceAlert && (
              <div
                className={`p-4 rounded-lg ${stats.priceAlert.type === "high" ? "bg-red-50 text-red-700" : "bg-yellow-50 text-yellow-700"}`}
              >
                <div className="flex items-center space-x-2">
                  <AlertCircle className="w-5 h-5" />
                  <span className="font-medium">
                    {stats.priceAlert.message}
                  </span>
                </div>
              </div>
            )}

            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
              <h3 className="font-bold text-gray-800 mb-4">مقارنة الأسعار</h3>
              <div className="grid grid-cols-2 gap-4">
                <div className="text-center p-4 bg-indigo-50 rounded-lg">
                  <p className="text-sm text-gray-600">متوسط أسعاري</p>
                  <p className="text-2xl font-bold text-indigo-600">
                    {stats?.avgQuotePrice || 0} ريال
                  </p>
                </div>
                <div className="text-center p-4 bg-gray-50 rounded-lg">
                  <p className="text-sm text-gray-600">متوسط السوق</p>
                  <p className="text-2xl font-bold text-gray-600">
                    {stats?.marketAvgPrice || 0} ريال
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* NOTIFICATIONS TAB */}
        {activeTab === "notifications" && (
          <div className="max-w-2xl mx-auto bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <h2 className="text-lg font-bold text-gray-900 mb-4">
              إعدادات التنبيهات والإشعارات
            </h2>
            <div className="space-y-4">
              <label className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50 cursor-pointer">
                <div>
                  <p className="font-medium">إشعارات البريد الإلكتروني</p>
                  <p className="text-sm text-gray-500">
                    تلقي إشعارات عبر البريد
                  </p>
                </div>
                <input
                  type="checkbox"
                  checked={formData.notificationSettings?.email}
                  onChange={() => handleNotificationChange("email")}
                  className="rounded text-indigo-600 w-5 h-5"
                />
              </label>
              <label className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50 cursor-pointer">
                <div>
                  <p className="font-medium">إشعارات واتساب</p>
                  <p className="text-sm text-gray-500">
                    تلقي إشعارات عبر واتساب
                  </p>
                </div>
                <input
                  type="checkbox"
                  checked={formData.notificationSettings?.whatsapp}
                  onChange={() => handleNotificationChange("whatsapp")}
                  className="rounded text-indigo-600 w-5 h-5"
                />
              </label>
              <label className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50 cursor-pointer">
                <div>
                  <p className="font-medium">إشعارات داخل الموقع</p>
                  <p className="text-sm text-gray-500">
                    تلقي إشعارات داخل المنصة
                  </p>
                </div>
                <input
                  type="checkbox"
                  checked={formData.notificationSettings?.internal}
                  onChange={() => handleNotificationChange("internal")}
                  className="rounded text-indigo-600 w-5 h-5"
                />
              </label>
            </div>
            <button
              onClick={handleProfileUpdate}
              className="w-full mt-6 bg-indigo-600 text-white py-2 rounded-lg hover:bg-indigo-700"
            >
              حفظ الإعدادات
            </button>
          </div>
        )}

        {/* INVOICES TAB */}
        {activeTab === "invoices" && (
          <div className="space-y-6">
            <h2 className="text-2xl font-bold text-gray-900">
              الفواتير والصفقات
            </h2>
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
              {invoices.length === 0 ? (
                <div className="p-12 text-center">
                  <FileText className="w-16 h-16 mx-auto text-gray-300 mb-4" />
                  <p className="text-gray-500">لا توجد فواتير حالياً</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-right">
                    <thead className="bg-gray-50 text-gray-500 text-sm">
                      <tr>
                        <th className="p-4">رقم الفاتورة</th>
                        <th className="p-4">التاريخ</th>
                        <th className="p-4">المبلغ</th>
                        <th className="p-4">المشتري</th>
                        <th className="p-4">الحالة</th>
                        <th className="p-4">إجراءات</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {invoices.map((inv) => (
                        <InvoiceRow key={inv.id} invoice={inv} />
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        )}
      </main>

      {/* Product Modal */}
      <ProductModal
        isOpen={productModal.isOpen}
        onClose={() => setProductModal({ isOpen: false, product: null })}
        onSave={handleProductSave}
        product={productModal.product}
        categories={categories}
      />
    </div>
  );
};

export default SellerDashboard;
