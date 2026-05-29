import React, { useState, useEffect, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  Loader2,
  Tag,
  User,
  Clock,
  Send,
  MessageSquare,
  AlertTriangle,
  CheckCircle,
  X,
  ShoppingCart,
  MapPin,
  Box,
} from "lucide-react";
import { useAuth } from "../hooks/useAuth";
import apiService from "../services/apiService";

// =========================================================================
// مكونات مساعدة (Utility Components)
// =========================================================================

const Notification = ({ message, type, onClose }) => {
  if (!message) return null;

  const baseStyle =
    "fixed top-4 right-4 z-50 p-4 rounded-lg shadow-xl flex items-center max-w-sm transition-opacity duration-300";
  let colorStyle;
  let Icon;

  switch (type) {
    case "success":
      colorStyle = "bg-green-500 text-white";
      Icon = CheckCircle;
      break;
    case "error":
      colorStyle = "bg-red-500 text-white";
      Icon = AlertTriangle;
      break;
    default:
      colorStyle = "bg-blue-500 text-white";
      Icon = MessageSquare;
  }

  return (
    <div className={`${baseStyle} ${colorStyle}`}>
      <Icon className="w-5 h-5 ml-3" />
      <p className="flex-grow text-sm">{message}</p>
      <button
        onClick={onClose}
        className="ml-2 p-1 rounded-full hover:bg-white hover:bg-opacity-20 transition"
      >
        <X className="w-4 h-4" />
      </button>
    </div>
  );
};

const ConfirmationModal = ({ isOpen, message, onConfirm, onCancel }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-gray-900 bg-opacity-75 z-50 flex items-center justify-center p-4">
      <div className="bg-white p-6 rounded-xl shadow-2xl max-w-sm w-full text-center">
        <AlertTriangle className="w-10 h-10 text-red-500 mx-auto mb-4" />
        <h3 className="text-xl font-bold mb-3">تأكيد الإجراء</h3>
        <p className="text-gray-600 mb-6">{message}</p>
        <div className="flex justify-around space-x-4">
          <button
            onClick={onCancel}
            className="flex-1 bg-gray-200 text-gray-800 py-2 rounded-lg hover:bg-gray-300 transition"
          >
            إلغاء
          </button>
          <button
            onClick={onConfirm}
            className="flex-1 bg-green-600 text-white py-2 rounded-lg hover:bg-green-700 transition"
          >
            تأكيد القبول
          </button>
        </div>
      </div>
    </div>
  );
};

// =========================================================================
// المكون الرئيسي (PostDetailsPage)
// =========================================================================

const PostDetailsPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user, isAuthenticated } = useAuth();

  const [post, setPost] = useState(null);
  const [offerAmount, setOfferAmount] = useState("");
  const [loading, setLoading] = useState(true);
  const [offers, setOffers] = useState([]);

  // حالة الإشعار
  const [notification, setNotification] = useState({ message: "", type: "" });
  // حالة المودال
  const [modal, setModal] = useState({
    isOpen: false,
    offerId: null,
    offerAmount: 0,
  });

  const showNotification = (message, type = "info") => {
    setNotification({ message, type });
    setTimeout(() => setNotification({ message: "", type: "" }), 5000);
  };

  // 1. جلب تفاصيل المنشور
  const fetchPostAndOffers = useCallback(async () => {
    try {
      setLoading(true);
      const postRes = await apiService.getPostById(id);
      setPost(postRes.data.post);

      const currentUserId = user?.id;
      const isOwner = currentUserId === postRes.data.post.buyerId;

      if (isOwner || user?.role === "admin") {
        try {
          const offersRes = await apiService.getPostOffers(id);
          setOffers(offersRes.data.offers.sort((a, b) => a.amount - b.amount));
        } catch (offerErr) {
          if (offerErr.response && offerErr.response.status !== 403) {
            console.error("فشل في جلب العروض:", offerErr);
          }
        }
      }
    } catch (err) {
      console.error("فشل في جلب المنشور:", err);
      showNotification("عفواً، لم يتم العثور على المنشور أو حدث خطأ.", "error");
    } finally {
      setLoading(false);
    }
  }, [id, user]);

  useEffect(() => {
    fetchPostAndOffers();
  }, [fetchPostAndOffers]);

  // V2 Logic:
  const isOwner = user && post && user.id === post.buyerId;
  const isSeller = user && user.role === "seller";
  const isPostActive =
    post && post.status === "active" && new Date(post.expiryDate) > new Date();

  // 2. معالج تقديم عرض جديد (للبائع)
  const handleSubmitOffer = async (e) => {
    e.preventDefault();
    if (!isAuthenticated || !isSeller)
      return showNotification("يجب تسجيل الدخول كبائع لتقديم عرض.", "error");
    if (!isPostActive)
      return showNotification(
        "لا يمكن تقديم عرض: المنشور غير نشط أو انتهت صلاحيته.",
        "error",
      );

    const amount = parseFloat(offerAmount);

    if (isNaN(amount) || amount <= 0)
      return showNotification("الرجاء إدخال مبلغ صحيح.", "error");

    try {
      await apiService.createOffer(id, amount);
      showNotification("✅ تم تقديم عرضك بنجاح!", "success");
      setOfferAmount("");
    } catch (err) {
      console.error("فشل تقديم العرض:", err);
      showNotification(
        `فشل تقديم العرض: ${err.response?.data?.message || "خطأ غير معروف."}`,
        "error",
      );
    }
  };

  // 3. معالج قبول عرض (للمشتري/المالك) - فتح المودال
  const handleAcceptOfferClick = (offerId, amount) => {
    if (!isOwner) return showNotification("غير مصرح لك بقبول العروض.", "error");
    setModal({
      isOpen: true,
      offerId,
      offerAmount: amount,
      message: `هل أنت متأكد من قبول العرض بقيمة ${amount.toFixed(2)} ريال؟ سيتم إغلاق الطلب وإنشاء صفقة.`,
    });
  };

  // 4. معالج قبول عرض (للمشتري/المالك) - التنفيذ بعد التأكيد
  const handleAcceptOffer = async () => {
    const { offerId } = modal;
    setModal({ ...modal, isOpen: false }); // إغلاق المودال أولاً

    try {
      await apiService.acceptOffer(offerId);
      showNotification("🎉 تم قبول العرض بنجاح وإغلاق الصفقة!", "success");
      setPost((prev) => ({ ...prev, status: "closed" })); // تحديث حالة المنشور
      setOffers((prev) =>
        prev.map((o) => (o.id === offerId ? { ...o, status: "accepted" } : o)),
      );
      setTimeout(() => navigate("/dashboard/buyer"), 2000);
    } catch (err) {
      console.error("فشل قبول العرض:", err);
      showNotification(
        `فشل قبول العرض: ${err.response?.data?.message || "خطأ غير معروف."}`,
        "error",
      );
    }
  };

  if (loading)
    return (
      <div className="flex items-center justify-center min-h-[80vh]">
        <Loader2 className="w-10 h-10 animate-spin text-indigo-600" />
        <span className="text-xl text-indigo-600 mr-4">
          جاري تحميل تفاصيل الطلب...
        </span>
      </div>
    );

  if (!post)
    return (
      <div className="text-center p-12 bg-red-50 border border-red-200 text-red-700 rounded-xl m-8">
        <AlertTriangle className="w-10 h-10 mx-auto mb-4" />
        <p className="font-bold text-xl">لم يتم العثور على الطلب.</p>
      </div>
    );

  const formattedExpiryDate = new Date(post.expiryDate).toLocaleString(
    "ar-EG",
    { dateStyle: "full", timeStyle: "short" },
  );
  const formattedDeliveryDate = post.deliveryDate
    ? new Date(post.deliveryDate).toLocaleDateString("ar-EG")
    : "غير محدد";

  return (
    <div className="p-4 md:p-8 bg-gray-50 min-h-screen">
      <Notification
        {...notification}
        onClose={() => setNotification({ message: "", type: "" })}
      />
      <ConfirmationModal
        isOpen={modal.isOpen}
        message={modal.message}
        onConfirm={handleAcceptOffer}
        onCancel={() => setModal({ ...modal, isOpen: false })}
      />

      <div className="max-w-7xl mx-auto">
        {/* Header with Status */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
          <h1 className="text-3xl md:text-4xl font-extrabold text-gray-900">
            {post.title}
          </h1>
          <span
            className={`px-4 py-2 text-base font-semibold rounded-full shadow-sm ${
              post.status === "active" && isPostActive
                ? "bg-green-100 text-green-800"
                : post.status === "closed"
                  ? "bg-gray-100 text-gray-800"
                  : "bg-red-100 text-red-800"
            }`}
          >
            {post.status === "active" && isPostActive
              ? "مفتوح للعروض"
              : post.status === "closed"
                ? "مغلق (تم الشراء)"
                : "منتهي الصلاحية"}
          </span>
        </div>

        <div className="flex flex-col lg:flex-row gap-8">
          {/* -------------------- العمود الأيمن (التفاصيل) -------------------- */}
          <div className="lg:w-2/3 space-y-8">
            {/* تفاصيل الطلب */}
            <div className="bg-white p-6 rounded-xl shadow-lg border border-gray-100">
              <h2 className="text-2xl font-bold text-gray-800 border-b pb-2 mb-4">
                تفاصيل الطلب
              </h2>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                <div className="flex items-center p-3 bg-gray-50 rounded-lg">
                  <Box className="w-6 h-6 ml-3 text-indigo-500" />
                  <div>
                    <p className="text-sm text-gray-500">الكمية المطلوبة</p>
                    <p className="font-bold text-lg">
                      {post.quantity} {post.unit}
                    </p>
                  </div>
                </div>
                <div className="flex items-center p-3 bg-gray-50 rounded-lg">
                  <MapPin className="w-6 h-6 ml-3 text-indigo-500" />
                  <div>
                    <p className="text-sm text-gray-500">موقع التوصيل</p>
                    <p className="font-bold text-lg">
                      {post.deliveryLocation || "غير محدد"}
                    </p>
                  </div>
                </div>
                <div className="flex items-center p-3 bg-gray-50 rounded-lg">
                  <Clock className="w-6 h-6 ml-3 text-indigo-500" />
                  <div>
                    <p className="text-sm text-gray-500">
                      تاريخ التوصيل المطلوب
                    </p>
                    <p className="font-bold text-lg">{formattedDeliveryDate}</p>
                  </div>
                </div>
                <div className="flex items-center p-3 bg-gray-50 rounded-lg">
                  <Tag className="w-6 h-6 ml-3 text-indigo-500" />
                  <div>
                    <p className="text-sm text-gray-500">التصنيف</p>
                    <p className="font-bold text-lg">
                      {post.Product?.Category?.name_ar || "عام"}
                    </p>
                  </div>
                </div>
              </div>

              <div className="mt-4">
                <h3 className="font-semibold text-gray-700 mb-2">وصف إضافي:</h3>
                <p className="text-gray-700 leading-relaxed whitespace-pre-wrap bg-gray-50 p-4 rounded-lg border border-gray-200">
                  {post.description}
                </p>
              </div>
            </div>

            {/* صور (إن وجدت) */}
            {post.images && post.images.length > 0 && post.images[0] !== "" && (
              <div className="bg-white p-6 rounded-xl shadow-lg border border-gray-100">
                <h2 className="text-xl font-bold text-gray-800 mb-4">
                  صور مرفقة
                </h2>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  {post.images.map((img, idx) => (
                    <img
                      key={idx}
                      src={img}
                      alt={`Post img ${idx}`}
                      className="w-full h-48 object-cover rounded-lg border"
                    />
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* -------------------- العمود الأيسر (تقديم العروض / قائمة العروض) -------------------- */}
          <div className="lg:w-1/3 space-y-6">
            {/* معلومات المشتري */}
            <div className="bg-white p-6 rounded-xl shadow-lg border border-gray-100 flex items-center">
              <div className="bg-indigo-100 p-3 rounded-full ml-4">
                <User className="w-8 h-8 text-indigo-600" />
              </div>
              <div>
                <p className="text-sm text-gray-500">صاحب الطلب</p>
                <p className="font-bold text-lg text-gray-900">
                  {post.Buyer?.name || "مشتري"}
                </p>
                {post.Buyer?.isPremium && (
                  <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-yellow-100 text-yellow-800 mt-1">
                    مشترك مميز
                  </span>
                )}
              </div>
            </div>

            {/* نموذج تقديم العرض - للبائعين فقط */}
            {isSeller && !isOwner && isPostActive && (
              <div className="p-6 bg-white rounded-xl shadow-lg border-2 border-indigo-100">
                <h3 className="text-xl font-bold mb-4 text-indigo-700">
                  تقديم عرض سعر
                </h3>
                <form onSubmit={handleSubmitOffer}>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    سعر العرض (ريال)
                  </label>
                  <div className="flex rounded-lg shadow-sm border border-gray-300 mb-4">
                    <input
                      type="number"
                      step="0.01"
                      min="1"
                      value={offerAmount}
                      onChange={(e) => setOfferAmount(e.target.value)}
                      className="flex-1 p-3 rounded-r-lg focus:ring-indigo-500 focus:border-indigo-500 text-lg text-right"
                      placeholder="أدخل سعرك..."
                      required
                      dir="rtl"
                    />
                    <span className="inline-flex items-center px-3 rounded-l-lg bg-gray-50 text-gray-500 text-sm border-r">
                      ريال
                    </span>
                  </div>

                  {/* 🔥 TIER RESTRICTION: Smart Pricing (Plan B Only) */}
                  <div className="mb-4 bg-gray-50 p-3 rounded border border-gray-200">
                    <label
                      className={`flex items-center space-x-2 rtl:space-x-reverse ${user?.subscriptionTier !== "plan_b" ? "opacity-50 cursor-not-allowed" : "cursor-pointer"}`}
                    >
                      <input
                        type="checkbox"
                        disabled={user?.subscriptionTier !== "plan_b"}
                        className="text-indigo-600 focus:ring-indigo-500 rounded"
                      />
                      <span className="text-sm font-medium text-gray-700">
                        تفعيل التسعير الذكي (تغيير السعر تلقائياً)
                      </span>
                    </label>
                    {user?.subscriptionTier !== "plan_b" && (
                      <p className="text-xs text-red-500 mt-1 mr-6">
                        متاح فقط لبائعي{" "}
                        <span className="font-bold">الفئة ب (Plan B)</span>.
                        <button
                          type="button"
                          className="underline mr-1 hover:text-red-700"
                        >
                          رقِ حسابك
                        </button>
                      </p>
                    )}
                  </div>

                  <button
                    type="submit"
                    className="w-full bg-indigo-600 text-white py-3 rounded-lg font-semibold hover:bg-indigo-700 transition-colors flex items-center justify-center shadow-md"
                  >
                    <Send className="w-5 h-5 ml-2" />
                    إرسال العرض
                  </button>
                </form>
              </div>
            )}

            {/* قائمة العروض - للمالك (المشتري) فقط */}
            {isOwner && (
              <div className="p-6 bg-white rounded-xl shadow-lg border border-gray-200">
                <div className="flex justify-between items-center mb-4 border-b pb-2">
                  <h3 className="text-xl font-bold text-gray-800">
                    العروض المستلمة
                  </h3>
                  <span className="bg-indigo-100 text-indigo-800 text-xs font-semibold px-2.5 py-0.5 rounded dark:bg-indigo-200 dark:text-indigo-900">
                    {offers.length}
                  </span>
                </div>

                {offers.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    <Box className="w-12 h-12 mx-auto mb-2 opacity-20" />
                    <p>لا توجد عروض حتى الآن.</p>
                  </div>
                ) : (
                  <ul className="space-y-3 max-h-96 overflow-y-auto pr-1">
                    {offers.map((offer) => (
                      <li
                        key={offer.id}
                        className={`p-4 rounded-lg border transition duration-150 ${
                          offer.status === "accepted"
                            ? "bg-green-50 border-green-500"
                            : "bg-white border-gray-200 hover:border-indigo-300"
                        }`}
                      >
                        <div className="flex justify-between items-start mb-2">
                          <div>
                            <p className="font-bold text-lg text-gray-900">
                              {parseFloat(offer.amount).toFixed(2)} ريال
                            </p>
                            <p className="text-xs text-gray-500">
                              بواسطة: {offer.Seller?.name || "بائع"}
                            </p>
                          </div>
                          {offer.status === "accepted" ? (
                            <span className="text-green-600 font-bold flex items-center text-sm">
                              <CheckCircle className="w-4 h-4 ml-1" />
                              مقبول
                            </span>
                          ) : (
                            isPostActive && (
                              <button
                                onClick={() =>
                                  handleAcceptOfferClick(offer.id, offer.amount)
                                }
                                className="bg-indigo-600 text-white px-3 py-1.5 text-xs rounded hover:bg-indigo-700 transition-colors"
                              >
                                قبول العرض
                              </button>
                            )
                          )}
                        </div>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default PostDetailsPage;
