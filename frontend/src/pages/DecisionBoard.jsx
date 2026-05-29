import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  Loader2,
  CheckCircle2,
  XCircle,
  Clock,
  MessageSquare,
  DollarSign,
  Award,
  ArrowRight,
  ShieldCheck,
} from "lucide-react";
import apiService from "../services/apiService";

const DecisionBoard = () => {
  const { id } = useParams(); // Request ID
  const navigate = useNavigate();
  const [request, setRequest] = useState(null);
  const [quotes, setQuotes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [processingId, setProcessingId] = useState(null);

  useEffect(() => {
    fetchData();
  }, [id]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [reqRes, quotesRes] = await Promise.all([
        apiService.getRequestById(id),
        apiService.getQuotesForRequest(id),
      ]);
      setRequest(reqRes.request || reqRes);
      setQuotes(quotesRes.quotes || quotesRes.data || []);
    } catch (error) {
      console.error("Error fetching decision board data:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleDecision = async (quoteId, status) => {
    setProcessingId(quoteId);
    try {
      const response = await apiService.makeQuoteDecision(quoteId, status);
      await fetchData(); // Refresh data
      if (status === "accepted") {
        const dealId = response.result?.deal?.id || response.deal?.id;
        alert("تم قبول العرض بنجاح! تم إنشاء صفقة جديدة ورؤية بيانات التواصل.");
        if (dealId) {
          navigate(`/invoice/${dealId}`);
        } else {
          navigate("/buyer-dashboard");
        }
      }
    } catch (error) {
      console.error("Error making decision:", error);
      alert(error.message || "حدث خطأ أثناء تنفيذ القرار");
    } finally {
      setProcessingId(null);
    }
  };

  if (loading)
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Loader2 className="w-12 h-12 animate-spin text-indigo-600" />
      </div>
    );

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      {/* Header */}
      <div className="bg-white border-b sticky top-0 z-10">
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
          <button
            onClick={() => navigate(-1)}
            className="p-2 hover:bg-gray-100 rounded-full transition-all"
          >
            <ArrowRight className="w-6 h-6 text-gray-600" />
          </button>
          <h1 className="text-xl font-bold text-gray-900">
            لوحة اتخاذ القرار للأصناف
          </h1>
          <div className="w-10"></div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-6 mt-8">
        {/* Request Context Bar */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 mb-8 flex flex-wrap items-center justify-between gap-4">
          <div>
            <span className="text-sm text-gray-500 block mb-1">
              الطلب الحالي
            </span>
            <h2 className="text-lg font-bold text-gray-900">{request.title}</h2>
          </div>
          <div className="flex gap-8">
            <div>
              <span className="text-sm text-gray-500 block mb-1">الكمية</span>
              <span className="font-bold text-gray-900">
                {request.quantity} {request.unit}
              </span>
            </div>
            <div>
              <span className="text-sm text-gray-500 block mb-1">
                عدد العروض
              </span>
              <span className="font-bold text-indigo-600">
                {quotes.length} عروض
              </span>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-6">
          {quotes.length === 0 ? (
            <div className="bg-white p-20 rounded-3xl text-center shadow-sm border-2 border-dashed border-gray-200">
              <Clock className="w-16 h-16 mx-auto text-gray-300 mb-4" />
              <h3 className="text-xl font-bold text-gray-900">
                لا توجد عروض مقدمة بعد
              </h3>
              <p className="text-gray-500 mt-2">
                سيتم إخطارك فور تلقي أول عرض سعر.
              </p>
            </div>
          ) : (
            quotes.map((quote, index) => (
              <div
                key={quote.id}
                className={`bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden transition-all ${quote.decisionStatus === "accepted" ? "ring-2 ring-green-500" : ""}`}
              >
                <div className="p-8 flex flex-col lg:flex-row gap-8">
                  {/* Seller Info & Ranking */}
                  <div className="lg:w-1/4 border-l border-gray-100 lg:pr-8">
                    <div className="flex items-center gap-3 mb-4">
                      <div className="w-12 h-12 bg-indigo-100 rounded-2xl flex items-center justify-center text-indigo-600 font-bold text-xl">
                        {quote.seller?.name?.[0] || "S"}
                      </div>
                      <div>
                        <h4 className="font-bold text-gray-900 line-clamp-1">
                          {quote.seller?.businessName || quote.seller?.name}
                        </h4>
                        <div className="flex items-center text-xs text-amber-600 mt-0.5">
                          <Award className="w-3 h-3 mr-1" />
                          رتبة البائع: {quote.seller?.rank || "جديد"}
                        </div>
                      </div>
                    </div>
                    <div className="space-y-2 mt-6">
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-500">الحالة</span>
                        <span
                          className={`font-medium ${
                            quote.decisionStatus === "accepted"
                              ? "text-green-600"
                              : quote.decisionStatus === "rejected"
                                ? "text-red-600"
                                : quote.decisionStatus === "backup"
                                  ? "text-amber-600"
                                  : "text-blue-600"
                          }`}
                        >
                          {quote.decisionStatus === "accepted"
                            ? "تم القبول"
                            : quote.decisionStatus === "rejected"
                              ? "مرفوض"
                              : quote.decisionStatus === "backup"
                                ? "قائمة الانتظار"
                                : "قيد المراجعة"}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Quote Details */}
                  <div className="lg:w-2/4">
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-6 mb-6">
                      <div>
                        <span className="text-xs text-gray-500 block mb-1 uppercase tracking-wider">
                          سعر الوحدة
                        </span>
                        <div className="text-2xl font-black text-gray-900 flex items-baseline">
                          {quote.amount || quote.fixedPrice}
                          <span className="text-xs text-gray-400 ml-1 font-normal">
                            ريال
                          </span>
                        </div>
                      </div>
                      <div>
                        <span className="text-xs text-gray-500 block mb-1 uppercase tracking-wider">
                          مدة التوريد
                        </span>
                        <div className="text-xl font-bold text-gray-900 flex items-center">
                          <Clock className="w-5 h-5 mr-2 text-indigo-500" />
                          {quote.deliveryTime || "---"} يوم
                        </div>
                      </div>
                      <div>
                        <span className="text-xs text-gray-500 block mb-1 uppercase tracking-wider">
                          الضمان
                        </span>
                        <div className="text-xl font-bold text-gray-900 flex items-center">
                          <ShieldCheck className="w-5 h-5 mr-2 text-indigo-500" />
                          {quote.warrantyMonths || 0} شهر
                        </div>
                      </div>
                    </div>

                    <div className="bg-gray-50 rounded-2xl p-4">
                      <h5 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-2 flex items-center">
                        <MessageSquare className="w-3.5 h-3.5 mr-1.5" />
                        ملاحظات البائع
                      </h5>
                      <p className="text-gray-700 text-sm leading-relaxed">
                        {quote.technicalDetails || "لا توجد ملاحظات إضافية."}
                      </p>
                    </div>
                  </div>

                  {/* Decision Actions */}
                  <div className="lg:w-1/4 flex flex-col justify-center gap-3">
                    <button
                      onClick={() => handleDecision(quote.id, "accepted")}
                      disabled={
                        processingId === quote.id ||
                        quote.decisionStatus === "accepted"
                      }
                      className="w-full bg-green-600 text-white py-3 rounded-xl font-bold flex items-center justify-center hover:bg-green-700 disabled:opacity-50 transition-all hover:scale-[1.02] active:scale-[0.98] shadow-lg shadow-green-100"
                    >
                      {processingId === quote.id ? (
                        <Loader2 className="w-5 h-5 animate-spin" />
                      ) : (
                        <>
                          <CheckCircle2 className="w-5 h-5 mr-2" />
                          قبول العرض
                        </>
                      )}
                    </button>

                    <div className="grid grid-cols-2 gap-3">
                      <button
                        onClick={() => handleDecision(quote.id, "backup")}
                        disabled={
                          processingId === quote.id ||
                          quote.decisionStatus === "backup"
                        }
                        className="bg-amber-50 text-amber-700 py-3 rounded-xl font-bold text-sm border border-amber-100 hover:bg-amber-100 disabled:opacity-50 transition-all"
                      >
                        الانتظار
                      </button>
                      <button
                        onClick={() => handleDecision(quote.id, "rejected")}
                        disabled={
                          processingId === quote.id ||
                          quote.decisionStatus === "rejected"
                        }
                        className="bg-red-50 text-red-700 py-3 rounded-xl font-bold text-sm border border-red-100 hover:bg-red-100 disabled:opacity-50 transition-all"
                      >
                        استبعاد
                      </button>
                    </div>
                  </div>
                </div>
                {quote.decisionStatus === "accepted" && (
                  <div className="bg-green-500 text-white text-center py-2 text-xs font-bold uppercase tracking-widest">
                    تم اختيار هذا العرض - الصفقة جارية
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default DecisionBoard;
