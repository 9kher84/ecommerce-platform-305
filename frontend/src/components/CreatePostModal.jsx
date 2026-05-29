import React, { useState } from "react";
import api from "../utils/api";

const CreatePostModal = ({ isOpen, onClose, onSuccess }) => {
  // حالة النموذج
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    startingPrice: "0.00",
    expiryDate: "",
    // حقل مطلوب للربط بالمنتج (نفترض أن البائع لديه قائمة بمعرفات منتجاته)
    productId: "",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // إذا لم تكن النافذة مفتوحة، لا تعرض شيئاً
  if (!isOpen) return null;

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      // التحقق الأساسي من الحقول
      const { title, description, startingPrice, expiryDate, productId } =
        formData;
      if (
        !title ||
        !description ||
        startingPrice === "" ||
        !expiryDate ||
        !productId
      ) {
        setError("الرجاء ملء جميع الحقول المطلوبة.");
        setLoading(false);
        return;
      }

      // إعداد البيانات وإرسالها
      const postData = {
        title,
        description,
        startingPrice: parseFloat(startingPrice),
        // يرسل datetime-local تنسيقاً مقبولاً غالباً
        expiryDate,
        productId: parseInt(productId, 10),
      };

      // ⚠️ ملاحظة: يفترض أن واجهة API في Backend (POST /api/posts)
      // تقوم باستخراج sellerId من التوكن (JWT) تلقائياً.
      const response = await api.post("/api/posts", postData);

      alert(`✅ تم إنشاء المنشور بنجاح: ${response.data.post.title}`);

      // تحديث لوحة التحكم تلقائياً
      onSuccess(response.data.post);
      onClose();
    } catch (err) {
      console.error("فشل في إنشاء المنشور:", err);
      setError(
        err.response?.data?.message ||
          "فشل في إنشاء المنشور. تأكد من إدخال جميع البيانات بشكل صحيح.",
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="fixed inset-0 bg-gray-600 bg-opacity-75 flex items-center justify-center z-50 transition-opacity"
      // يسمح بالإغلاق بالنقر خارج النافذة
      onClick={onClose}
    >
      <div
        className="bg-white rounded-lg shadow-xl w-full max-w-lg mx-4"
        onClick={(e) => e.stopPropagation()}
      >
        {/* رأس النافذة */}
        <div className="p-5 border-b flex justify-between items-center">
          <h3 className="text-xl font-semibold text-gray-900">
            إنشاء منشور مزايدة جديد
          </h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
            aria-label="إغلاق"
          >
            &times;
          </button>
        </div>

        {/* جسم النافذة (النموذج) */}
        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          {error && (
            <div
              className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative text-sm"
              role="alert"
            >
              {error}
            </div>
          )}

          {/* عنوان المنشور */}
          <div>
            <label
              htmlFor="title"
              className="block text-sm font-medium text-gray-700"
            >
              عنوان المنشور
            </label>
            <input
              type="text"
              name="title"
              id="title"
              value={formData.title}
              onChange={handleChange}
              required
              className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
            />
          </div>

          {/* الوصف */}
          <div>
            <label
              htmlFor="description"
              className="block text-sm font-medium text-gray-700"
            >
              الوصف التفصيلي
            </label>
            <textarea
              name="description"
              id="description"
              rows="3"
              value={formData.description}
              onChange={handleChange}
              required
              className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2 resize-none"
            ></textarea>
          </div>

          {/* السعر وتاريخ الانتهاء */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label
                htmlFor="startingPrice"
                className="block text-sm font-medium text-gray-700"
              >
                سعر البدء (ريال)
              </label>
              <input
                type="number"
                name="startingPrice"
                id="startingPrice"
                value={formData.startingPrice}
                onChange={handleChange}
                required
                min="0"
                step="0.01"
                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
              />
            </div>
            <div>
              <label
                htmlFor="expiryDate"
                className="block text-sm font-medium text-gray-700"
              >
                تاريخ ووقت الانتهاء
              </label>
              <input
                type="datetime-local"
                name="expiryDate"
                id="expiryDate"
                value={formData.expiryDate}
                onChange={handleChange}
                required
                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
              />
            </div>
          </div>

          {/* معرف المنتج */}
          <div>
            <label
              htmlFor="productId"
              className="block text-sm font-medium text-gray-700"
            >
              معرف المنتج المرتبط (Product ID)
            </label>
            <input
              type="number"
              name="productId"
              id="productId"
              value={formData.productId}
              onChange={handleChange}
              required
              min="1"
              className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
              placeholder="مثال: 1"
            />
          </div>

          {/* تذييل النافذة (الإرسال) */}
          <div className="pt-4 flex justify-end">
            <button
              type="button"
              onClick={onClose}
              className="mr-2 px-4 py-2 text-sm font-medium text-gray-700 bg-gray-200 rounded-md hover:bg-gray-300 transition-colors"
              disabled={loading}
            >
              إلغاء
            </button>
            <button
              type="submit"
              className="px-4 py-2 text-sm font-medium text-white bg-primary-600 rounded-md hover:bg-primary-700 transition-colors disabled:opacity-50"
              disabled={loading}
            >
              {loading ? "جاري الإنشاء..." : "إنشاء المنشور"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreatePostModal;
