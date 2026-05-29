import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  Loader2,
  ArrowRight,
  DollarSign,
  Clock,
  Calendar,
  ShieldCheck,
  Info,
  CheckCircle2,
} from "lucide-react";
import apiService from "../services/apiService";

const SubmitQuote = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [rfq, setRfq] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    amount: "",
    deliveryTime: "",
    warrantyMonths: "0",
    technicalDetails: "",
    notes: "",
    priceType: "fixed",
  });
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    fetchRFQDetails();
  }, [id]);

  const fetchRFQDetails = async () => {
    setLoading(true);
    try {
      const response = await apiService.getRequestById(id);
      setRfq(response.request || response);
    } catch (error) {
      console.error("Error fetching RFQ:", error);
      alert("تعذر تحميل تفاصيل الطلب");
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const payload = {
        ...formData,
        fixedPrice: formData.amount,
        amount: formData.amount, // Dual mapping for compatibility
      };
      await apiService.submitQuote(id, payload);
      setSuccess(true);
      setTimeout(() => navigate("/seller-dashboard"), 3000);
    } catch (error) {
      console.error("Error submitting quote:", error);
      alert(error.message || "حدث خطأ أثناء تقديم العرض");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading)
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Loader2 className="w-12 h-12 animate-spin text-indigo-600" />
      </div>
    );

  if (success)
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 p-6">
        <div className="max-w-md w-full bg-white rounded-3xl shadow-xl p-8 text-center animate-in fade-in zoom-in duration-500">
          <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <CheckCircle2 className="w-12 h-12 text-green-600" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            تم تقديم عرضك بنجاح!
          </h2>
          <p className="text-gray-500 mb-8">
            سيتم إخطار المشتري فوراً. سيتم توجيهك إلى لوحة التحكم خلال لحظات...
          </p>
          <button
            onClick={() => navigate("/seller-dashboard")}
            className="w-full bg-indigo-600 text-white py-3 rounded-xl font-bold hover:bg-indigo-700 transition-all"
          >
            العودة للوحة التحكم الآن
          </button>
        </div>
      </div>
    );

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      {/* Header */}
      <div className="bg-white border-b sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-6 py-4 flex items-center justify-between">
          <button
            onClick={() => navigate(-1)}
            className="p-2 hover:bg-gray-100 rounded-full transition-all"
          >
            <ArrowRight className="w-6 h-6 text-gray-600" />
          </button>
          <h1 className="text-lg font-bold text-gray-900">تقديم عرض سعر</h1>
          <div className="w-10"></div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-6 mt-8">
        {/* RFQ Summary Card */}
        <div className="bg-indigo-900 rounded-3xl p-8 mb-8 text-white shadow-xl relative overflow-hidden">
          <div className="relative z-10">
            <div className="flex justify-between items-start mb-6">
              <div>
                <span className="bg-indigo-500/30 text-indigo-100 px-3 py-1 rounded-full text-xs font-bold mb-2 inline-block">
                  {rfq.category?.name_ar || "تصنيف عام"}
                </span>
                <h2 className="text-2xl font-bold">{rfq.title}</h2>
              </div>
              <div className="text-right">
                <p className="text-indigo-200 text-sm">الكمية المطلوبة</p>
                <p className="text-xl font-bold">
                  {rfq.quantity} {rfq.unit}
                </p>
              </div>
            </div>
            <div className="flex flex-wrap gap-6 text-indigo-100 text-sm">
              <div className="flex items-center">
                <Calendar className="w-4 h-4 mr-2 opacity-70" />
                مطلوب قبل:{" "}
                {rfq.delivery_date
                  ? new Date(rfq.delivery_date).toLocaleDateString("ar-SA")
                  : "مرن"}
              </div>
              <div className="flex items-center">
                <Info className="w-4 h-4 mr-2 opacity-70" />
                {rfq.quotesCount || 0} عروض مقدمة حتى الآن
              </div>
            </div>
          </div>
          {/* Decorative background element */}
          <div className="absolute -bottom-10 -right-10 w-40 h-40 bg-indigo-500/20 rounded-full blur-3xl"></div>
        </div>

        {/* Form */}
        <form
          onSubmit={handleSubmit}
          className="grid grid-cols-1 md:grid-cols-3 gap-8"
        >
          <div className="md:col-span-2 space-y-6">
            <div className="bg-white rounded-3xl p-8 shadow-sm border border-gray-100">
              <h3 className="text-lg font-bold text-gray-900 mb-6 flex items-center">
                <DollarSign className="w-5 h-5 mr-2 text-indigo-600" />
                تفاصيل العرض المالي
              </h3>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    سعر الوحدة (ريال سعودي) *
                  </label>
                  <div className="relative">
                    <input
                      type="number"
                      required
                      value={formData.amount}
                      onChange={(e) =>
                        setFormData({ ...formData, amount: e.target.value })
                      }
                      className="w-full pl-12 pr-4 py-4 bg-gray-50 border-0 focus:ring-2 focus:ring-indigo-500 rounded-2xl text-xl font-bold transition-all"
                      placeholder="0.00"
                    />
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 font-bold">
                      SAR
                    </span>
                  </div>
                  <p className="text-xs text-gray-500 mt-2">
                    الإجمالي المتوقع:{" "}
                    <span className="font-bold text-gray-700">
                      {(formData.amount * rfq.quantity).toLocaleString()} ريال
                    </span>
                  </p>
                </div>

                <div className="pt-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    مدة التوريد (أيام) *
                  </label>
                  <div className="relative">
                    <Clock className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
                    <input
                      type="number"
                      required
                      value={formData.deliveryTime}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          deliveryTime: e.target.value,
                        })
                      }
                      className="w-full pl-12 pr-4 py-3 bg-gray-50 border-0 focus:ring-2 focus:ring-indigo-500 rounded-2xl transition-all"
                      placeholder="أيام"
                    />
                  </div>
                </div>

                <div className="pt-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    فترة الضمان (أشهر)
                  </label>
                  <div className="relative">
                    <ShieldCheck className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
                    <input
                      type="number"
                      value={formData.warrantyMonths}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          warrantyMonths: e.target.value,
                        })
                      }
                      className="w-full pl-12 pr-4 py-3 bg-gray-50 border-0 focus:ring-2 focus:ring-indigo-500 rounded-2xl transition-all"
                      placeholder="اختياري"
                    />
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-3xl p-8 shadow-sm border border-gray-100">
              <h3 className="text-lg font-bold text-gray-900 mb-6 flex items-center">
                <Info className="w-5 h-5 mr-2 text-indigo-600" />
                التفاصيل الفنية والملاحظات
              </h3>

              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    المواصفات الفنية المشمولة
                  </label>
                  <textarea
                    rows="4"
                    value={formData.technicalDetails}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        technicalDetails: e.target.value,
                      })
                    }
                    className="w-full p-4 bg-gray-50 border-0 focus:ring-2 focus:ring-indigo-500 rounded-2xl transition-all"
                    placeholder="اذكر أهم المواصفات التي يتضمنها عرضك..."
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    ملاحظات إضافية للمشتري
                  </label>
                  <textarea
                    rows="3"
                    value={formData.notes}
                    onChange={(e) =>
                      setFormData({ ...formData, notes: e.target.value })
                    }
                    className="w-full p-4 bg-gray-50 border-0 focus:ring-2 focus:ring-indigo-500 rounded-2xl transition-all"
                    placeholder="أي شروط أو تفاصيل أخرى تود إضافتها..."
                  />
                </div>
              </div>
            </div>
          </div>

          <div className="space-y-6">
            <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100 sticky top-24">
              <h4 className="font-bold text-gray-900 mb-4">ملخص العرض</h4>
              <div className="space-y-3 mb-6">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">سعر الوحدة</span>
                  <span className="font-medium text-gray-900">
                    {formData.amount || 0} ريال
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">الكمية</span>
                  <span className="font-medium text-gray-900">
                    {rfq.quantity} {rfq.unit}
                  </span>
                </div>
                <div className="border-t pt-3 flex justify-between">
                  <span className="font-bold text-gray-900">الإجمالي</span>
                  <span className="font-bold text-indigo-600 text-lg">
                    {(formData.amount * rfq.quantity).toLocaleString()} ريال
                  </span>
                </div>
              </div>

              <div className="p-4 bg-amber-50 rounded-xl mb-6">
                <p className="text-xs text-amber-800 leading-relaxed">
                  * بتقديم هذا العرض، أنت تلتزم بتوفير السلعة بالمواصفات
                  المذكورة خلال المدة المحددة في حال القبول.
                </p>
              </div>

              <button
                type="submit"
                disabled={submitting}
                className="w-full bg-indigo-600 text-white py-4 rounded-2xl font-bold hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-indigo-200 transition-all flex items-center justify-center"
              >
                {submitting ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin mr-2" />
                    جاري الإرسال...
                  </>
                ) : (
                  "إرسال عرض السعر"
                )}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};

export default SubmitQuote;
