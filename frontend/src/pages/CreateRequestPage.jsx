import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Save, Send, Loader2 } from "lucide-react";
import apiService from "../services/apiService";
import { useAuth } from "../hooks/useAuth";

const CreateRequestPage = () => {
  const navigate = useNavigate();
  const { user } = useAuth();

  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    title: "",
    categoryId: "",
    description: "",
    quantity: "",
    unit: "",
    deliveryDates: [
      new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
        .toISOString()
        .split("T")[0],
    ],
    deliveryLocations: [
      {
        address: "",
        city: "",
        coordinates: {},
      },
    ],
    requiresDelivery: true,
    requiresInstallation: false,
    contactNumbers: [""],
    images: [],
    pdfAttachments: [],
    hideOffers: false,
    hidePersonalInfo: false,
    directPurchase: false,
    targetSellerId: null,
  });

  const [errors, setErrors] = useState({});

  // حدود الخطط
  const tierLimits = {
    free: {
      dates: 1,
      locations: 1,
      contacts: 1,
      images: 0,
      pdfs: 0,
      hideOffers: false,
    },
    plan_a: {
      dates: 1,
      locations: 1,
      contacts: 2,
      images: 1,
      pdfs: 1,
      hideOffers: true,
    },
    plan_b: {
      dates: 999,
      locations: 999,
      contacts: 999,
      images: 2,
      pdfs: 999,
      hideOffers: true,
    },
  };

  // Regex patterns
  const regexPatterns = {
    numeric: /^-?\d*\.?\d+$/,
    saudiPhone: /^(?:\+966|0)?5[0-9]{8}$/,
    arabicText: /^[\u0600-\u06FF\s0-9\-_.,]+$/,
    positiveNumber: /^\d*\.?\d+$/,
  };

  useEffect(() => {
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    try {
      const response = await apiService.getAllCategories();
      if (response.data && Array.isArray(response.data.categories)) {
        setCategories(response.data.categories);
      } else if (Array.isArray(response)) {
        setCategories(response);
      } else {
        setCategories([]);
      }
    } catch (error) {
      console.error("Error fetching categories:", error);
      setCategories([]);
    }
  };

  // 🔥 دالة handleSubmit المحدثة للـ RFQ
  const handleSubmit = async (e, action = "draft") => {
    e.preventDefault();

    if (!validateForm()) {
      alert("يرجى تصحيح الأخطاء في النموذج قبل الإرسال");
      return;
    }

    setLoading(true);

    try {
      const requestData = {
        ...formData,
        // 🔥 RFQ Mapping
        delivery_date: formData.deliveryDates[0],
        categoryId: formData.categoryId ? parseInt(formData.categoryId) : null,
        deliveryDates: formData.deliveryDates.map((date) =>
          new Date(date).toISOString(),
        ),
        contactNumbers: formData.contactNumbers.filter(
          (num) => num.trim() !== "",
        ),
        directPurchase: formData.directPurchase || false,
        targetSellerId: formData.targetSellerId || null,
      };

      const response = await apiService.createRequest(requestData);

      if (action === "publish" && response.data?.id) {
        await apiService.publishRequest(response.data.id, {
          publishAsRFQ: true,
        });
      }

      alert(
        action === "publish"
          ? "تم نشر طلب الـ RFQ بنجاح!"
          : "تم حفظ الطلب كمسودة!",
      );
      navigate("/buyer-dashboard");
    } catch (error) {
      console.error("Error creating request:", error);
      alert(error.message || "حدث خطأ أثناء إنشاء الطلب");
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    const newValue = type === "checkbox" ? checked : value;

    setFormData((prev) => ({
      ...prev,
      [name]: newValue,
    }));

    validateField(name, newValue);
  };

  const validateField = (name, value) => {
    const newErrors = { ...errors };

    switch (name) {
      case "title":
        if (!value.trim()) {
          newErrors.title = "العنوان مطلوب";
        } else {
          delete newErrors.title;
        }
        break;

      case "quantity":
        if (value && !regexPatterns.positiveNumber.test(value)) {
          newErrors.quantity = "يجب أن تكون الكمية رقماً موجباً";
        } else {
          delete newErrors.quantity;
        }
        break;

      case "contactNumbers":
        if (value && !regexPatterns.saudiPhone.test(value.replace(/\s/g, ""))) {
          newErrors.contact =
            "رقم الهاتف غير صحيح. مثال: 0512345678 أو +966512345678";
        } else {
          delete newErrors.contact;
        }
        break;

      default:
        break;
    }

    setErrors(newErrors);
  };

  const handleLocationChange = (index, field, value) => {
    const newLocations = [...formData.deliveryLocations];
    newLocations[index][field] = value;
    setFormData((prev) => ({ ...prev, deliveryLocations: newLocations }));
  };

  const handleDateChange = (index, value) => {
    const newDates = [...formData.deliveryDates];
    newDates[index] = value;
    setFormData((prev) => ({ ...prev, deliveryDates: newDates }));
  };

  const handleContactChange = (index, value) => {
    const newContacts = [...formData.contactNumbers];
    newContacts[index] = value;
    setFormData((prev) => ({ ...prev, contactNumbers: newContacts }));
    validateField("contactNumbers", value);
  };

  const addContactNumber = () => {
    const limits = tierLimits[user?.subscriptionTier || "free"];
    if (formData.contactNumbers.length < limits.contacts) {
      setFormData((prev) => ({
        ...prev,
        contactNumbers: [...prev.contactNumbers, ""],
      }));
    }
  };

  const addDeliveryDate = () => {
    const limits = tierLimits[user?.subscriptionTier || "free"];
    if (formData.deliveryDates.length < limits.dates) {
      setFormData((prev) => ({
        ...prev,
        deliveryDates: [
          ...prev.deliveryDates,
          new Date(Date.now() + 14 * 24 * 60 * 60 * 1000)
            .toISOString()
            .split("T")[0],
        ],
      }));
    }
  };

  const addDeliveryLocation = () => {
    const limits = tierLimits[user?.subscriptionTier || "free"];
    if (formData.deliveryLocations.length < limits.locations) {
      setFormData((prev) => ({
        ...prev,
        deliveryLocations: [
          ...prev.deliveryLocations,
          { address: "", city: "", coordinates: {} },
        ],
      }));
    }
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.title.trim()) {
      newErrors.title = "العنوان مطلوب";
    }

    if (
      formData.quantity &&
      !regexPatterns.positiveNumber.test(formData.quantity)
    ) {
      newErrors.quantity = "يجب أن تكون الكمية رقماً موجباً";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const limits = tierLimits[user?.subscriptionTier || "free"];

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <button
            onClick={() => navigate("/buyer-dashboard")}
            className="flex items-center text-gray-600 hover:text-gray-900 mb-4"
          >
            <ArrowLeft className="w-5 h-5 ml-2" />
            العودة إلى لوحة التحكم
          </button>
          <h1 className="text-3xl font-bold text-gray-900">
            إنشاء طلب شراء جديد
          </h1>
          <p className="text-gray-600 mt-2">
            املأ التفاصيل أدناه لإنشاء طلب شراء
          </p>
        </div>

        {/* Form */}
        <form
          onSubmit={(e) => handleSubmit(e, "draft")}
          className="bg-white rounded-lg shadow-md p-6"
        >
          {/* Basic RFQ Info */}
          <div className="mb-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4">
              تفاصيل طلب التوريد (RFQ)
            </h2>

            <div className="mb-4">
              <label className="block text-gray-700 font-semibold mb-2">
                عنوان الطلب (RFQ Title) *
              </label>
              <input
                type="text"
                name="title"
                value={formData.title}
                onChange={handleChange}
                className={`w-full border rounded-lg p-3 focus:ring-2 focus:ring-indigo-500 focus:border-transparent ${errors.title ? "border-red-500" : "border-gray-300"}`}
                placeholder="مثال: توريد 500 متر كابلات كهربائية"
                required
              />
              {errors.title && (
                <p className="text-red-500 text-sm mt-1">{errors.title}</p>
              )}
            </div>

            <div className="mb-4">
              <label className="block text-gray-700 font-semibold mb-2">
                القطاع / التصنيف *
              </label>
              <select
                name="categoryId"
                value={formData.categoryId}
                onChange={handleChange}
                className="w-full border border-gray-300 rounded-lg p-3 focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                required
              >
                <option value="">اختر التصنيف</option>
                {categories.map((cat) => (
                  <option key={cat.id} value={cat.id}>
                    {cat.name_ar}
                  </option>
                ))}
              </select>
            </div>

            <div className="mb-4">
              <label className="block text-gray-700 font-semibold mb-2">
                تاريخ التسليم المطلوب *
              </label>
              <input
                type="date"
                value={formData.deliveryDates[0]}
                onChange={(e) => handleDateChange(0, e.target.value)}
                className="w-full border border-gray-300 rounded-lg p-3 focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-4 mb-4">
              <div>
                <label className="block text-gray-700 font-semibold mb-2">
                  الكمية المطلوبة
                </label>
                <input
                  type="text"
                  name="quantity"
                  value={formData.quantity}
                  onChange={handleChange}
                  className={`w-full border rounded-lg p-3 focus:ring-2 focus:ring-indigo-500 focus:border-transparent ${errors.quantity ? "border-red-500" : "border-gray-300"}`}
                  placeholder="500"
                />
              </div>
              <div>
                <label className="block text-gray-700 font-semibold mb-2">
                  الوحدة
                </label>
                <input
                  type="text"
                  name="unit"
                  value={formData.unit}
                  onChange={handleChange}
                  className="w-full border border-gray-300 rounded-lg p-3 focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  placeholder="متر، طن، كيس..."
                />
              </div>
            </div>

            <div className="mb-4">
              <label className="block text-gray-700 font-semibold mb-2">
                المواصفات الفنية والشروط
              </label>
              <textarea
                name="description"
                value={formData.description}
                onChange={handleChange}
                rows="5"
                className="w-full border border-gray-300 rounded-lg p-3 focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                placeholder="اكتب المواصفات الفنية بدقة هنا..."
              ></textarea>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex space-x-4 pt-6 border-t">
            <button
              type="submit"
              disabled={loading}
              className="flex-1 bg-gray-200 text-gray-800 py-3 rounded-lg hover:bg-gray-300 font-semibold flex items-center justify-center space-x-2 disabled:opacity-50"
            >
              {loading ? (
                <Loader2 className="animate-spin" />
              ) : (
                <>
                  <Save className="w-5 h-5" />
                  <span>حفظ مسودة</span>
                </>
              )}
            </button>
            <button
              type="button"
              onClick={(e) => handleSubmit(e, "publish")}
              disabled={loading}
              className="flex-1 bg-indigo-600 text-white py-3 rounded-lg hover:bg-indigo-700 font-semibold flex items-center justify-center space-x-2 disabled:opacity-50"
            >
              {loading ? (
                <Loader2 className="animate-spin" />
              ) : (
                <>
                  <Send className="w-5 h-5" />
                  <span>نشر طلب الـ RFQ</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreateRequestPage;
