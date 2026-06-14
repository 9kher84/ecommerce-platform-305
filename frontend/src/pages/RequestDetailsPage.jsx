import React, { useState, useEffect } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import {
  ArrowLeft,
  Package,
  MapPin,
  Calendar,
  Phone,
  FileText,
  Loader2,
  CheckCircle,
  XCircle,
  MessageSquare,
  Edit,
  Trash2,
} from "lucide-react";
import { Helmet } from "react-helmet-async";
import apiService from "../services/apiService";
import { useAuth } from "../hooks/useAuth";
import JsonLd from "../components/JsonLd";

const RequestDetailsPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [request, setRequest] = useState(null);
  const [quotes, setQuotes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeAction, setActiveAction] = useState(null);

  useEffect(() => {
    fetchRequestDetails();
  }, [id]);

  const fetchRequestDetails = async () => {
    setLoading(true);
    try {
      // 1. Fetch Request Details First
      const requestRes = await apiService.getRequestById(id);
      const reqData = requestRes.request;
      setRequest(reqData);

      // Default to quotes included in the request (if any)
      let fetchedQuotes = reqData.quotes || [];

      // 2. Determine if user should fetch full quotes
      const isOwner = user?.id === reqData.buyerId;
      const isAdmin = user?.role === "admin" || user?.role === "super_admin";

      if (isOwner || isAdmin) {
        try {
          const quotesRes = await apiService.getRequestQuotes(id);
          fetchedQuotes = quotesRes.data || fetchedQuotes;
        } catch (e) {
          console.warn("Quotes unavailable", e);
        }
      }

      setQuotes(fetchedQuotes);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleAcceptQuote = async (quoteId) => {
    if (!window.confirm("هل أنت متأكد من قبول هذا العرض؟")) return;

    setActiveAction(quoteId);
    try {
      await apiService.acceptQuote(quoteId);
      alert("تم قبول العرض بنجاح!");
      fetchRequestDetails();
    } catch (err) {
      alert(err.message || "فشل في قبول العرض");
    } finally {
      setActiveAction(null);
    }
  };

  const handleRejectQuote = async (quoteId) => {
    const reason = window.prompt("سبب الرفض (اختياري):");

    setActiveAction(quoteId);
    try {
      await apiService.rejectQuote(quoteId, reason || "لم يتم تحديد سبب");
      alert("تم رفض العرض");
      fetchRequestDetails();
    } catch (err) {
      alert(err.message || "فشل في رفض العرض");
    } finally {
      setActiveAction(null);
    }
  };

  const handleNegotiate = async (quoteId) => {
    const proposedPrice = window.prompt("اقترح سعراً جديداً:");
    if (!proposedPrice) return;

    const message = window.prompt("رسالة للبائع (اختياري):");

    setActiveAction(quoteId);
    try {
      await apiService.negotiateQuote(
        quoteId,
        parseFloat(proposedPrice),
        message || "",
      );
      alert("تم إرسال طلب المفاوضة");
      fetchRequestDetails();
    } catch (err) {
      alert(err.message || "فشل في إرسال المفاوضة");
    } finally {
      setActiveAction(null);
    }
  };

  const handleWithdraw = async (quoteId) => {
    if (!window.confirm("هل أنت متأكد من سحب هذا العرض؟")) return;
    const reason = window.prompt("سبب السحب (اختياري):");
    setActiveAction(quoteId);
    try {
      await apiService.withdrawQuote(quoteId, reason || "");
      alert("تم سحب العرض بنجاح");
      fetchRequestDetails();
    } catch (err) {
      alert(err.message || "فشل في سحب العرض");
    } finally {
      setActiveAction(null);
    }
  };

  const handleToggleHideOffers = async () => {
    try {
      await apiService.updateRequest(request.id, {
        hideOffers: !request.hideOffers,
      });
      setRequest((prev) => ({ ...prev, hideOffers: !prev.hideOffers }));
      alert("تم تحديث إعدادات الخصوصية");
    } catch (err) {
      alert(err.message || "فشل في تحديث الإعدادات");
    }
  };

  const ModifyQuoteForm = ({ quote, onCancel }) => {
    const [priceType, setPriceType] = useState(quote.priceType);
    const [fixedPrice, setFixedPrice] = useState(quote.fixedPrice || "");
    const [minPrice, setMinPrice] = useState(quote.priceRangeMin || "");
    const [maxPrice, setMaxPrice] = useState(quote.priceRangeMax || "");
    const [flexibilityReason, setFlexibilityReason] = useState(
      quote.flexibilityReason || "",
    );
    const [canDeliver, setCanDeliver] = useState(quote.canDeliver);
    const [deliveryCost, setDeliveryCost] = useState(quote.deliveryCost || "");
    const [canInstall, setCanInstall] = useState(quote.canInstall);
    const [technicalDetails, setTechnicalDetails] = useState(
      quote.technicalDetails || "",
    );
    const [submitting, setSubmitting] = useState(false);

    const handleSubmit = async (e) => {
      e.preventDefault();
      setSubmitting(true);
      try {
        const quoteData = {
          priceType,
          fixedPrice: priceType === "fixed" ? parseFloat(fixedPrice) : null,
          priceRangeMin: priceType === "flexible" ? parseFloat(minPrice) : null,
          priceRangeMax: priceType === "flexible" ? parseFloat(maxPrice) : null,
          flexibilityReason,
          canDeliver,
          deliveryCost: canDeliver ? parseFloat(deliveryCost) : 0,
          canInstall,
          technicalDetails,
        };
        await apiService.modifyQuote(quote.id, quoteData);
        alert("تم تعديل العرض بنجاح!");
        fetchRequestDetails();
        onCancel();
      } catch (err) {
        alert(err.message || "فشل في تعديل العرض");
      } finally {
        setSubmitting(false);
      }
    };

    return (
      <div className="bg-gray-50 p-4 rounded-lg mt-4 border border-indigo-200">
        <h3 className="font-bold text-indigo-700 mb-4">تعديل العرض</h3>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              نوع السعر
            </label>
            <div className="flex space-x-4 rtl:space-x-reverse">
              <label className="flex items-center">
                <input
                  type="radio"
                  value="fixed"
                  checked={priceType === "fixed"}
                  onChange={(e) => setPriceType(e.target.value)}
                  className="ml-2"
                />{" "}
                سعر ثابت
              </label>
              <label className="flex items-center">
                <input
                  type="radio"
                  value="flexible"
                  checked={priceType === "flexible"}
                  onChange={(e) => setPriceType(e.target.value)}
                  className="ml-2"
                />{" "}
                سعر مرن
              </label>
            </div>
          </div>

          {priceType === "fixed" ? (
            <input
              type="number"
              value={fixedPrice}
              onChange={(e) => setFixedPrice(e.target.value)}
              placeholder="السعر"
              className="block w-full rounded-md border-gray-300 p-2"
              required
            />
          ) : (
            <div className="grid grid-cols-2 gap-2">
              <input
                type="number"
                value={minPrice}
                onChange={(e) => setMinPrice(e.target.value)}
                placeholder="الحد الأدنى"
                className="block w-full rounded-md border-gray-300 p-2"
                required
              />
              <input
                type="number"
                value={maxPrice}
                onChange={(e) => setMaxPrice(e.target.value)}
                placeholder="الحد الأقصى"
                className="block w-full rounded-md border-gray-300 p-2"
                required
              />
            </div>
          )}

          <div className="flex space-x-2 pt-2">
            <button
              type="submit"
              disabled={submitting}
              className="bg-indigo-600 text-white px-4 py-2 rounded hover:bg-indigo-700 disabled:opacity-50"
            >
              حفظ التعديلات
            </button>
            <button
              type="button"
              onClick={onCancel}
              className="bg-gray-300 text-gray-700 px-4 py-2 rounded hover:bg-gray-400"
            >
              إلغاء
            </button>
          </div>
        </form>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Loader2 className="w-12 h-12 animate-spin text-indigo-600" />
      </div>
    );
  }

  if (error || !request) {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-4xl mx-auto bg-red-50 border border-red-200 rounded-lg p-6">
          <p className="text-red-600 font-semibold">
            {error || "الطلب غير موجود"}
          </p>
          <button
            onClick={() => navigate(-1)}
            className="mt-4 text-indigo-600 hover:underline"
          >
            العودة
          </button>
        </div>
      </div>
    );
  }

  const isBuyer = user?.id === request.buyerId;
  const isSeller = user?.role === "seller";
  // Check backend flag OR frontend logic (fallback)
  const isFreeBuyerViewingOthers =
    request.isRestricted ||
    (user?.role === "buyer" && user?.subscriptionTier === "free" && !isBuyer);

  const statusColors = {
    draft: "bg-gray-100 text-gray-800",
    published: "bg-blue-100 text-blue-800",
    negotiating: "bg-yellow-100 text-yellow-800",
    accepted: "bg-green-100 text-green-800",
    completed: "bg-green-600 text-white",
    cancelled: "bg-red-100 text-red-800",
    expired: "bg-gray-300 text-gray-600",
  };

  // Free buyer viewing someone else's request - show restricted view
  if (isFreeBuyerViewingOthers) {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-4xl mx-auto">
          <div className="bg-white rounded-lg shadow-md p-6 mb-6">
            <button
              onClick={() => navigate(-1)}
              className="flex items-center text-gray-600 hover:text-gray-900 mb-4"
            >
              <ArrowLeft className="w-5 h-5 ml-2" />
              العودة
            </button>

            <h1 className="text-3xl font-bold text-gray-900 mb-6">
              {request.title}
            </h1>

            <div className="bg-yellow-50 border-2 border-yellow-300 rounded-lg p-8 text-center">
              <div className="text-6xl mb-4">🔒</div>
              <h2 className="text-2xl font-bold text-gray-900 mb-3">
                عفواً، لست صاحب الطلب ولا تمتلك الصلاحية للاطلاع
              </h2>
              <p className="text-gray-700 mb-6">
                هذه الميزة متاحة لأصحاب الطلبات والبائعين فقط.
              </p>
              <div className="bg-white rounded-lg p-6 mb-6">
                <p className="text-gray-800 font-semibold mb-3">
                  💡 للاستفادة الكاملة من المنصة:
                </p>
                <ul className="text-right text-gray-700 space-y-2">
                  <li>✅ قم بإنشاء طلب شراء خاص بك</li>
                  <li>✅ استقبل عروض أسعار من البائعين</li>
                  <li>✅ فاوض واختر أفضل عرض</li>
                  <li>✅ استفد من الخدمات المدفوعة للمزيد من المميزات</li>
                </ul>
              </div>
              <Link
                to="/create-request"
                className="inline-block bg-indigo-600 text-white px-8 py-3 rounded-lg hover:bg-indigo-700 transition-colors font-semibold"
              >
                إنشاء طلب شراء جديد
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ... existing code ...

  const SubmitQuoteSection = () => {
    const [priceType, setPriceType] = useState("fixed");
    const [fixedPrice, setFixedPrice] = useState("");
    const [minPrice, setMinPrice] = useState("");
    const [maxPrice, setMaxPrice] = useState("");
    const [flexibilityReason, setFlexibilityReason] = useState("");
    const [canDeliver, setCanDeliver] = useState(false);
    const [deliveryCost, setDeliveryCost] = useState("");
    const [canInstall, setCanInstall] = useState(false);
    const [technicalDetails, setTechnicalDetails] = useState("");
    const [submitting, setSubmitting] = useState(false);
    const [selectedFile, setSelectedFile] = useState(null);
    const [validationErrors, setValidationErrors] = useState({});

    // Phone number validation utility
    const containsPhoneNumber = (text) => {
      if (!text) return false;
      const phonePatterns = [
        /05\d{8}/, // 05xxxxxxxx
        /\+9665\d{8}/, // +9665xxxxxxxx
        /00966\d{9}/, // 00966xxxxxxxxx
        /9665\d{8}/, // 9665xxxxxxxx
        /966\s*5\d{8}/, // 966 5xxxxxxxx
      ];
      return phonePatterns.some((pattern) =>
        pattern.test(text.replace(/\s/g, "")),
      );
    };

    // Validate price field
    const validatePrice = (value, fieldName) => {
      if (containsPhoneNumber(value)) {
        setValidationErrors((prev) => ({
          ...prev,
          [fieldName]: "لا يمكن إدخال أرقام هواتف في حقل السعر",
        }));
        return false;
      }
      setValidationErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors[fieldName];
        return newErrors;
      });
      return true;
    };

    // Validate technical details
    const validateTechnicalDetails = (value) => {
      if (containsPhoneNumber(value)) {
        setValidationErrors((prev) => ({
          ...prev,
          technicalDetails:
            "لا يمكن إدخال أرقام هواتف. يرجى استخدام نظام المراسلة الداخلي للتواصل",
        }));
        return false;
      }
      setValidationErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors.technicalDetails;
        return newErrors;
      });
      return true;
    };

    // Handle file selection
    const handleFileChange = (e) => {
      const file = e.target.files[0];
      if (!file) {
        setSelectedFile(null);
        return;
      }

      // Validate file type
      const allowedTypes = [
        "image/jpeg",
        "image/png",
        "image/jpg",
        "application/pdf",
      ];
      if (!allowedTypes.includes(file.type)) {
        alert("يرجى اختيار صورة (JPG, PNG) أو ملف PDF فقط");
        e.target.value = "";
        return;
      }

      // Validate file size (5MB for free tier)
      const maxSize = 5 * 1024 * 1024; // 5MB
      if (file.size > maxSize) {
        alert("حجم الملف يجب أن لا يتجاوز 5 ميجابايت");
        e.target.value = "";
        return;
      }

      setSelectedFile(file);
    };

    const isPlanA = ["plan_a", "plan_b"].includes(user?.subscriptionTier);
    const isPlanB = user?.subscriptionTier === "plan_b";

    const handleSubmit = async (e) => {
      e.preventDefault();

      // Validate all fields before submission
      let isValid = true;
      if (priceType === "fixed") {
        isValid = validatePrice(fixedPrice, "fixedPrice") && isValid;
      } else {
        isValid = validatePrice(minPrice, "minPrice") && isValid;
        isValid = validatePrice(maxPrice, "maxPrice") && isValid;
      }
      if (canDeliver) {
        isValid = validatePrice(deliveryCost, "deliveryCost") && isValid;
      }
      if (isPlanB && technicalDetails) {
        isValid = validateTechnicalDetails(technicalDetails) && isValid;
      }

      if (!isValid) {
        alert("يرجى تصحيح الأخطاء قبل الإرسال");
        return;
      }

      setSubmitting(true);
      try {
        // Use FormData if file is selected
        if (selectedFile) {
          const formData = new FormData();
          formData.append("purchaseRequestId", request.id);
          formData.append("priceType", priceType);
          formData.append(
            "fixedPrice",
            priceType === "fixed" ? parseFloat(fixedPrice) : "",
          );
          formData.append(
            "priceRangeMin",
            priceType === "flexible" ? parseFloat(minPrice) : "",
          );
          formData.append(
            "priceRangeMax",
            priceType === "flexible" ? parseFloat(maxPrice) : "",
          );
          formData.append("flexibilityReason", flexibilityReason || "");
          formData.append("canDeliver", canDeliver);
          formData.append(
            "deliveryCost",
            canDeliver ? parseFloat(deliveryCost) : 0,
          );
          formData.append("canInstall", canInstall);
          if (isPlanB && technicalDetails) {
            formData.append("technicalDetails", technicalDetails);
          }
          formData.append("invoiceFile", selectedFile);

          // Note: This will require backend route update to handle multipart/form-data
          await apiService.submitQuote(request.id, formData);
        } else {
          const quoteData = {
            purchaseRequestId: request.id,
            priceType,
            fixedPrice: priceType === "fixed" ? parseFloat(fixedPrice) : null,
            priceRangeMin:
              priceType === "flexible" ? parseFloat(minPrice) : null,
            priceRangeMax:
              priceType === "flexible" ? parseFloat(maxPrice) : null,
            flexibilityReason,
            canDeliver,
            deliveryCost: canDeliver ? parseFloat(deliveryCost) : 0,
            canInstall,
            technicalDetails: isPlanB ? technicalDetails : null,
          };

          await apiService.submitQuote(request.id, quoteData);
        }

        alert("تم تقديم عرض السعر بنجاح!");
        fetchRequestDetails();
      } catch (err) {
        alert(err.message || "فشل في تقديم العرض");
      } finally {
        setSubmitting(false);
      }
    };

    // Check if seller already submitted a quote
    const myQuote = quotes.find((q) => q.sellerId === user?.id);
    if (myQuote) {
      return (
        <div className="bg-green-50 border border-green-200 rounded-lg p-6 mb-6">
          <h3 className="text-lg font-bold text-green-800 mb-2">
            ✅ لقد قدمت عرضاً لهذا الطلب
          </h3>
          <p className="text-green-700">حالة العرض: {myQuote.status}</p>
        </div>
      );
    }

    return (
      <div className="bg-white rounded-lg shadow-md p-6 mb-6 border-t-4 border-indigo-600">
        <h2 className="text-xl font-bold text-gray-900 mb-6">تقديم عرض سعر</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Price Type */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              نوع السعر
            </label>
            <div className="flex space-x-4 rtl:space-x-reverse">
              <label className="flex items-center">
                <input
                  type="radio"
                  value="fixed"
                  checked={priceType === "fixed"}
                  onChange={(e) => setPriceType(e.target.value)}
                  className="ml-2"
                />
                سعر ثابت
              </label>
              <label
                className={`flex items-center ${!isPlanA ? "opacity-50 cursor-not-allowed" : ""}`}
              >
                <input
                  type="radio"
                  value="flexible"
                  checked={priceType === "flexible"}
                  onChange={(e) => setPriceType(e.target.value)}
                  disabled={!isPlanA}
                  className="ml-2"
                />
                سعر مرن (Plan A/B)
              </label>
            </div>
            {!isPlanA && (
              <p className="text-xs text-gray-500 mt-1">
                الترقية للخطة A مطلوبة للسعر المرن
              </p>
            )}
          </div>

          {/* Price Fields */}
          {priceType === "fixed" ? (
            <div>
              <label className="block text-sm font-medium text-gray-700">
                السعر (ريال)
              </label>
              <input
                type="number"
                value={fixedPrice}
                onChange={(e) => setFixedPrice(e.target.value)}
                onBlur={(e) => validatePrice(e.target.value, "fixedPrice")}
                className={`mt-1 block w-full rounded-md shadow-sm focus:border-indigo-500 focus:ring-indigo-500 ${
                  validationErrors.fixedPrice
                    ? "border-red-500"
                    : "border-gray-300"
                }`}
                required
              />
              {validationErrors.fixedPrice && (
                <p className="mt-1 text-sm text-red-600">
                  {validationErrors.fixedPrice}
                </p>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  الحد الأدنى
                </label>
                <input
                  type="number"
                  value={minPrice}
                  onChange={(e) => setMinPrice(e.target.value)}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  الحد الأقصى
                </label>
                <input
                  type="number"
                  value={maxPrice}
                  onChange={(e) => setMaxPrice(e.target.value)}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                  required
                />
              </div>
              <div className="col-span-2">
                <label className="block text-sm font-medium text-gray-700">
                  سبب المرونة
                </label>
                <input
                  type="text"
                  value={flexibilityReason}
                  onChange={(e) => setFlexibilityReason(e.target.value)}
                  placeholder="مثلاً: يعتمد على نوع المواد المستخدمة"
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                />
              </div>
            </div>
          )}

          {/* Delivery & Installation */}
          <div className="flex space-x-6 rtl:space-x-reverse">
            <label className="flex items-center">
              <input
                type="checkbox"
                checked={canDeliver}
                onChange={(e) => setCanDeliver(e.target.checked)}
                className="ml-2 rounded text-indigo-600"
              />
              إمكانية التوصيل
            </label>
            <label className="flex items-center">
              <input
                type="checkbox"
                checked={canInstall}
                onChange={(e) => setCanInstall(e.target.checked)}
                className="ml-2 rounded text-indigo-600"
              />
              إمكانية التركيب
            </label>
          </div>

          {canDeliver && (
            <div>
              <label className="block text-sm font-medium text-gray-700">
                تكلفة التوصيل (ريال)
              </label>
              <input
                type="number"
                value={deliveryCost}
                onChange={(e) => setDeliveryCost(e.target.value)}
                onBlur={(e) => validatePrice(e.target.value, "deliveryCost")}
                className={`mt-1 block w-full rounded-md shadow-sm focus:border-indigo-500 focus:ring-indigo-500 ${
                  validationErrors.deliveryCost
                    ? "border-red-500"
                    : "border-gray-300"
                }`}
              />
              {validationErrors.deliveryCost && (
                <p className="mt-1 text-sm text-red-600">
                  {validationErrors.deliveryCost}
                </p>
              )}
            </div>
          )}

          {/* Plan B Fields */}
          {isPlanB && (
            <div className="border-t pt-4 mt-4">
              <h4 className="text-sm font-bold text-indigo-700 mb-3">
                مميزات Plan B
              </h4>
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  تفاصيل فنية دقيقة
                </label>
                <textarea
                  value={technicalDetails}
                  onChange={(e) => setTechnicalDetails(e.target.value)}
                  onBlur={(e) => validateTechnicalDetails(e.target.value)}
                  rows={3}
                  className={`mt-1 block w-full rounded-md shadow-sm focus:border-indigo-500 focus:ring-indigo-500 ${
                    validationErrors.technicalDetails
                      ? "border-red-500"
                      : "border-gray-300"
                  }`}
                  placeholder="وصف تفصيلي للمنتج والمواصفات..."
                />
                {validationErrors.technicalDetails && (
                  <p className="mt-1 text-sm text-red-600">
                    {validationErrors.technicalDetails}
                  </p>
                )}
              </div>
              {/* Invoice File Upload */}
              <div className="mt-3">
                <label className="block text-sm font-medium text-gray-700">
                  صورة الفاتورة أو PDF (اختياري)
                </label>
                <input
                  type="file"
                  accept="image/jpeg,image/png,image/jpg,application/pdf"
                  onChange={handleFileChange}
                  className="mt-1 block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100"
                />
                {selectedFile && (
                  <p className="text-xs text-green-600 mt-1">
                    ✓ تم اختيار: {selectedFile.name} (
                    {(selectedFile.size / 1024).toFixed(2)} KB)
                  </p>
                )}
                <p className="text-xs text-gray-500 mt-1">
                  يمكنك رفع صورة واحدة (JPG, PNG) أو ملف PDF واحد فقط (الحد
                  الأقصى: 5 ميجابايت)
                </p>
              </div>
            </div>
          )}

          <button
            type="submit"
            disabled={submitting}
            className="w-full bg-indigo-600 text-white py-3 rounded-lg hover:bg-indigo-700 transition-colors font-bold disabled:opacity-50"
          >
            {submitting ? "جاري الإرسال..." : "إرسال عرض السعر"}
          </button>
        </form>
      </div>
    );
  };

  const schemaData = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: request?.title,
    description: request?.description,
    brand: {
      "@type": "Brand",
      name: "Sovereign",
    },
    offers: {
      "@type": "AggregateOffer",
      offerCount: quotes.length || 0,
      priceCurrency: "SAR",
      lowPrice: quotes.length
        ? Math.min(
            ...quotes.map((q) =>
              q.priceType === "fixed" ? q.fixedPrice : q.priceRangeMin,
            ),
          )
        : 0,
      highPrice: quotes.length
        ? Math.max(
            ...quotes.map((q) =>
              q.priceType === "fixed" ? q.fixedPrice : q.priceRangeMax,
            ),
          )
        : 0,
    },
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <Helmet>
        <title>{request?.title} - Sovereign Platform</title>
        <meta
          name="description"
          content={request?.description?.substring(0, 160)}
        />
      </Helmet>
      <JsonLd data={schemaData} />
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <button
            onClick={() => navigate(-1)}
            className="flex items-center text-gray-600 hover:text-gray-900 mb-4"
          >
            <ArrowLeft className="w-5 h-5 ml-2" />
            العودة
          </button>

          <div className="flex justify-between items-start">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                {request.title}
              </h1>
              <p className="text-gray-600 mt-2">رقم الطلب: #{request.id}</p>
            </div>
            <div className="flex flex-col items-end gap-2">
              <span
                className={`px-4 py-2 rounded-full text-sm font-semibold ${statusColors[request.status]}`}
              >
                {request.status}
              </span>
              {request.status === "deal_in_progress" && (
                <button
                  onClick={() => navigate(`/chat/${request.id}`)}
                  className="bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 flex items-center gap-2 shadow-sm transition-all"
                >
                  <MessageSquare className="w-5 h-5" />
                  فتح المحادثة الفورية
                </button>
              )}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Request Details */}
          <div className="lg:col-span-2 space-y-6">
            {/* Accepted Quote View for Plan A/B Buyers */}
            {request.acceptedQuote &&
              !isBuyer &&
              ["plan_a", "plan_b"].includes(user?.subscriptionTier) && (
                <div className="bg-green-50 border border-green-200 rounded-lg p-6 shadow-sm">
                  <div className="flex items-center mb-4">
                    <CheckCircle className="w-6 h-6 text-green-600 ml-2" />
                    <h2 className="text-xl font-bold text-green-800">
                      تم قبول عرض لهذا الطلب
                    </h2>
                  </div>
                  <div className="bg-white p-4 rounded-lg border border-green-100">
                    <p className="text-gray-600 mb-1">البائع:</p>
                    <p className="font-bold text-gray-900 text-lg mb-3">
                      {request.acceptedQuote.sellerName}
                    </p>

                    <p className="text-gray-600 mb-1">السعر النهائي:</p>
                    <p className="font-bold text-indigo-600 text-2xl">
                      {request.acceptedQuote.price}{" "}
                      {request.acceptedQuote.currency}
                    </p>

                    <p className="text-xs text-gray-500 mt-3">
                      تاريخ القبول:{" "}
                      {new Date(
                        request.acceptedQuote.acceptedAt,
                      ).toLocaleDateString("ar-SA")}
                    </p>
                  </div>
                </div>
              )}

            {/* Description */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <h2 className="text-xl font-bold text-gray-900 mb-4">
                الوصف والمواصفات
              </h2>
              <p className="text-gray-700 whitespace-pre-wrap">
                {request.description || "لا يوجد وصف"}
              </p>
            </div>

            {/* Delivery Info */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <h2 className="text-xl font-bold text-gray-900 mb-4">
                معلومات التسليم
              </h2>

              <div className="space-y-3">
                <div className="flex items-start">
                  <MapPin className="w-5 h-5 text-gray-400 ml-2 mt-1" />
                  <div>
                    <p className="font-semibold text-gray-700">المواقع:</p>
                    {request.deliveryLocations?.map((loc, idx) => (
                      <p key={idx} className="text-gray-600">
                        {loc.city} - {loc.address}
                      </p>
                    ))}
                  </div>
                </div>

                <div className="flex items-start">
                  <Calendar className="w-5 h-5 text-gray-400 ml-2 mt-1" />
                  <div>
                    <p className="font-semibold text-gray-700">
                      التواريخ المقترحة:
                    </p>
                    {request.deliveryDates?.map((date, idx) => (
                      <p key={idx} className="text-gray-600">
                        {new Date(date).toLocaleDateString("ar-SA")}
                      </p>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Submit Quote Section (Sellers Only) */}
            {isSeller && request.status === "published" && (
              <SubmitQuoteSection />
            )}

            {/* Quotes Section */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <h2 className="text-xl font-bold text-gray-900 mb-4">
                عروض الأسعار ({quotes.length})
              </h2>

              {quotes.length === 0 ? (
                <div className="text-center py-8">
                  <FileText className="w-12 h-12 mx-auto text-gray-400 mb-3" />
                  <p className="text-gray-600">لا توجد عروض أسعار حتى الآن</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {quotes.map((quote) => (
                    <div
                      key={quote.id}
                      className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow"
                    >
                      <div className="flex justify-between items-start mb-3">
                        <div>
                          <p className="font-semibold text-gray-900">
                            {quote.Seller?.name || "بائع"}
                          </p>
                          <p className="text-sm text-gray-600">
                            {new Date(quote.createdAt).toLocaleDateString(
                              "ar-SA",
                            )}
                          </p>
                        </div>
                        <div className="text-left">
                          {quote.priceType === "fixed" ? (
                            <p className="text-2xl font-bold text-indigo-600">
                              {quote.fixedPrice} ريال
                            </p>
                          ) : (
                            <div>
                              <p className="text-lg font-bold text-indigo-600">
                                {quote.priceRangeMin} - {quote.priceRangeMax}{" "}
                                ريال
                              </p>
                              <p className="text-xs text-gray-500">
                                {quote.flexibilityReason}
                              </p>
                            </div>
                          )}
                        </div>
                      </div>

                      {quote.notes && (
                        <p className="text-gray-700 mb-3 text-sm">
                          {quote.notes}
                        </p>
                      )}

                      {quote.technicalDetails && (
                        <div className="bg-gray-50 rounded p-3 mb-3">
                          <p className="text-sm font-semibold text-gray-700 mb-1">
                            التفاصيل الفنية:
                          </p>
                          <p className="text-sm text-gray-600">
                            {quote.technicalDetails}
                          </p>
                        </div>
                      )}

                      {isBuyer && quote.status === "pending" && (
                        <div className="flex space-x-2 mt-3">
                          <button
                            onClick={() => handleAcceptQuote(quote.id)}
                            disabled={activeAction === quote.id}
                            className="flex-1 bg-green-600 text-white py-2 rounded-lg hover:bg-green-700 transition-colors flex items-center justify-center space-x-1 disabled:opacity-50"
                          >
                            <CheckCircle className="w-4 h-4" />
                            <span>قبول</span>
                          </button>
                          <button
                            onClick={() => handleNegotiate(quote.id)}
                            disabled={activeAction === quote.id}
                            className="flex-1 bg-yellow-500 text-white py-2 rounded-lg hover:bg-yellow-600 transition-colors flex items-center justify-center space-x-1 disabled:opacity-50"
                          >
                            <MessageSquare className="w-4 h-4" />
                            <span>مفاوضة</span>
                          </button>
                          <button
                            onClick={() => handleRejectQuote(quote.id)}
                            disabled={activeAction === quote.id}
                            className="flex-1 bg-red-600 text-white py-2 rounded-lg hover:bg-red-700 transition-colors flex items-center justify-center space-x-1 disabled:opacity-50"
                          >
                            <XCircle className="w-4 h-4" />
                            <span>رفض</span>
                          </button>
                        </div>
                      )}

                      {quote.status !== "pending" && (
                        <div
                          className={`mt-3 px-3 py-2 rounded text-sm font-semibold ${
                            quote.status === "accepted"
                              ? "bg-green-100 text-green-800"
                              : quote.status === "rejected"
                                ? "bg-red-100 text-red-800"
                                : "bg-gray-100 text-gray-800"
                          }`}
                        >
                          {quote.status === "accepted" && "تم القبول"}
                          {quote.status === "rejected" && "تم الرفض"}
                          {quote.status === "withdrawn" && "تم السحب"}
                        </div>
                      )}

                      {/* Seller Actions: Withdraw (Pending) or Modify (Rejected + Plan B) */}
                      {isSeller && quote.sellerId === user?.id && (
                        <div className="mt-3 border-t pt-3">
                          {quote.status === "pending" && (
                            <button
                              onClick={() => handleWithdraw(quote.id)}
                              className="text-red-600 hover:text-red-800 text-sm font-semibold flex items-center"
                            >
                              <Trash2 className="w-4 h-4 ml-1" />
                              سحب العرض
                            </button>
                          )}
                          {quote.status === "rejected" &&
                            user?.subscriptionTier === "plan_b" && (
                              <div>
                                {activeAction === `modify_${quote.id}` ? (
                                  <ModifyQuoteForm
                                    quote={quote}
                                    onCancel={() => setActiveAction(null)}
                                  />
                                ) : (
                                  <button
                                    onClick={() =>
                                      setActiveAction(`modify_${quote.id}`)
                                    }
                                    className="text-indigo-600 hover:text-indigo-800 text-sm font-semibold flex items-center"
                                  >
                                    <Edit className="w-4 h-4 ml-1" />
                                    تعديل العرض (Plan B)
                                  </button>
                                )}
                              </div>
                            )}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Quick Info */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <h3 className="font-bold text-gray-900 mb-4">معلومات سريعة</h3>

              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-gray-600">الكمية:</span>
                  <span className="font-semibold">
                    {request.quantity} {request.unit}
                  </span>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-gray-600">التصنيف:</span>
                  <span className="font-semibold">
                    {request.Category?.name_ar}
                  </span>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-gray-600">المشاهدات:</span>
                  <span className="font-semibold">
                    {request.viewCount || 0}
                  </span>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-gray-600">العروض:</span>
                  <span className="font-semibold">
                    {request.quoteCount || 0}
                  </span>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-gray-600">تاريخ الإنشاء:</span>
                  <span className="font-semibold text-sm">
                    {new Date(request.createdAt).toLocaleDateString("ar-SA")}
                  </span>
                </div>

                {request.expiresAt && (
                  <div className="flex items-center justify-between">
                    <span className="text-gray-600">ينتهي في:</span>
                    <span className="font-semibold text-sm">
                      {new Date(request.expiresAt).toLocaleDateString("ar-SA")}
                    </span>
                  </div>
                )}
              </div>
            </div>

            {/* Actions */}
            {isBuyer && request.status === "draft" && (
              <div className="bg-white rounded-lg shadow-md p-6">
                <h3 className="font-bold text-gray-900 mb-4">الإجراءات</h3>
                <div className="space-y-2">
                  <Link
                    to={`/edit-request/${request.id}`}
                    className="block w-full bg-indigo-600 text-white py-2 rounded-lg hover:bg-indigo-700 transition-colors text-center"
                  >
                    تعديل الطلب
                  </Link>
                  <button
                    onClick={async () => {
                      try {
                        await apiService.publishRequest(request.id);
                        alert("تم نشر الطلب بنجاح!");
                        fetchRequestDetails();
                      } catch (err) {
                        alert(err.message);
                      }
                    }}
                    className="w-full bg-green-600 text-white py-2 rounded-lg hover:bg-green-700 transition-colors"
                  >
                    نشر الطلب
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default RequestDetailsPage;
