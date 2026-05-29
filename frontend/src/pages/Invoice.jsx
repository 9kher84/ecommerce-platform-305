import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  Loader2,
  Download,
  Printer,
  Phone,
  Mail,
  MapPin,
  Calendar,
  FileText,
  ArrowRight,
  Briefcase,
  User,
  ShieldCheck,
  CheckCircle2,
} from "lucide-react";
import apiService from "../services/apiService";

const Invoice = () => {
  const { id } = useParams(); // Deal ID
  const navigate = useNavigate();
  const [deal, setDeal] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDealDetails();
  }, [id]);

  const fetchDealDetails = async () => {
    setLoading(true);
    try {
      const response = await apiService.getDealById(id);
      setDeal(response.deal || response);
    } catch (error) {
      console.error("Error fetching deal details:", error);
      alert("تعذر تحميل بيانات الفاتورة");
    } finally {
      setLoading(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  if (loading)
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Loader2 className="w-12 h-12 animate-spin text-indigo-600" />
      </div>
    );

  if (!deal) return <div className="p-20 text-center">الصفقة غير موجودة</div>;

  const { purchaseRequest, seller, buyer, priceQuote } = deal;

  return (
    <div className="min-h-screen bg-slate-50 pb-20 print:bg-white print:pb-0">
      {/* Navigation Header - Hidden on Print */}
      <div className="bg-white border-b sticky top-0 z-10 print:hidden">
        <div className="max-w-4xl mx-auto px-6 py-4 flex items-center justify-between">
          <button
            onClick={() => navigate(-1)}
            className="p-2 hover:bg-gray-100 rounded-full transition-all"
          >
            <ArrowRight className="w-6 h-6 text-gray-600" />
          </button>
          <h1 className="text-lg font-bold text-gray-900">
            مستند الصفقة وتفاصيل الاتصال
          </h1>
          <div className="flex gap-2">
            <button
              onClick={handlePrint}
              className="p-2 bg-indigo-50 text-indigo-600 rounded-lg hover:bg-indigo-100 transition-all"
            >
              <Printer className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-6 mt-8 print:mt-0">
        {/* Status Banner */}
        <div className="bg-green-600 rounded-2xl p-4 mb-8 text-white flex items-center justify-between shadow-lg shadow-green-100 print:hidden">
          <div className="flex items-center gap-3">
            <CheckCircle2 className="w-6 h-6" />
            <span className="font-bold">
              تم تأكيد الصفقة - معلومات الاتصال مكشوفة الآن
            </span>
          </div>
          <span className="text-sm bg-white/20 px-3 py-1 rounded-full">
            رقم الصفقة: #{deal.id.split("-")[0].toUpperCase()}
          </span>
        </div>

        {/* Main Paper */}
        <div className="bg-white shadow-2xl rounded-3xl overflow-hidden border border-gray-100 print:shadow-none print:border-0">
          {/* Header Section */}
          <div className="bg-slate-900 p-10 text-white flex justify-between items-start">
            <div>
              <div className="text-3xl font-black mb-2 tracking-tight">
                INVOICE
              </div>
              <div className="text-slate-400 text-sm">فاتورة ضريبية مبسطة</div>
            </div>
            <div className="text-right">
              <h2 className="text-xl font-bold mb-1">منصة Sovereign</h2>
              <p className="text-slate-400 text-xs">نظام المشتريات والتعميد</p>
            </div>
          </div>

          <div className="p-10">
            {/* Parties Section */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-12 mb-12">
              {/* Seller Info */}
              <div className="space-y-4">
                <h3 className="text-gray-400 text-xs font-bold uppercase tracking-widest border-b pb-2">
                  البائع (المورد)
                </h3>
                <div className="space-y-3">
                  <div className="flex items-center gap-3">
                    <Briefcase className="w-5 h-5 text-indigo-600" />
                    <span className="text-lg font-bold text-gray-900">
                      {seller.businessName || seller.name}
                    </span>
                  </div>
                  <div className="flex items-center gap-3 text-gray-600 bg-indigo-50/50 p-2 rounded-lg border border-indigo-100 border-dashed">
                    <Phone className="w-4 h-4 text-indigo-500" />
                    <span className="font-mono font-bold">
                      {seller.mobile || "رقم مخفي"}
                    </span>
                  </div>
                  <div className="flex items-center gap-3 text-gray-600">
                    <Mail className="w-4 h-4 text-gray-400" />
                    <span>{seller.email}</span>
                  </div>
                </div>
              </div>

              {/* Buyer Info */}
              <div className="space-y-4">
                <h3 className="text-gray-400 text-xs font-bold uppercase tracking-widest border-b pb-2 text-left md:text-right">
                  المشتري (الجهة الطالبة)
                </h3>
                <div className="space-y-3 text-left md:text-right flex flex-col items-end">
                  <div className="flex items-center gap-3">
                    <span className="text-lg font-bold text-gray-900">
                      {buyer.name}
                    </span>
                    <User className="w-5 h-5 text-indigo-600" />
                  </div>
                  <div className="flex flex-row-reverse items-center gap-3 text-gray-600 bg-amber-50/50 p-2 rounded-lg border border-amber-100 border-dashed">
                    <Phone className="w-4 h-4 text-amber-600" />
                    <span className="font-mono font-bold">
                      {buyer.mobile || "رقم مخفي"}
                    </span>
                  </div>
                  <div className="flex flex-row-reverse items-center gap-3 text-gray-600">
                    <Mail className="w-4 h-4 text-gray-400" />
                    <span>{buyer.email}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Order Details */}
            <div className="bg-slate-50 rounded-2xl p-6 mb-12 flex flex-wrap justify-between gap-6">
              <div className="flex items-center gap-3">
                <Calendar className="w-5 h-5 text-indigo-600" />
                <div>
                  <span className="text-[10px] text-gray-400 uppercase block">
                    تاريخ الإبرام
                  </span>
                  <span className="text-sm font-bold">
                    {new Date(deal.createdAt).toLocaleDateString("ar-SA")}
                  </span>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <MapPin className="w-5 h-5 text-indigo-600" />
                <div>
                  <span className="text-[10px] text-gray-400 uppercase block">
                    عنوان التوريد
                  </span>
                  <span className="text-sm font-bold">
                    {purchaseRequest.deliveryLocations?.[0]?.city ||
                      "أنحاء المملكة"}
                  </span>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <ShieldCheck className="w-5 h-5 text-indigo-600" />
                <div>
                  <span className="text-[10px] text-gray-400 uppercase block">
                    مرجع النظام
                  </span>
                  <span className="text-sm font-mono font-bold">
                    SOV-{deal.id.substr(0, 8).toUpperCase()}
                  </span>
                </div>
              </div>
            </div>

            {/* Line Items */}
            <table className="w-full mb-12">
              <thead>
                <tr className="text-right border-b-2 border-slate-100">
                  <th className="py-4 font-bold text-gray-900">الوصف</th>
                  <th className="py-4 font-bold text-gray-900 text-center">
                    الكمية
                  </th>
                  <th className="py-4 font-bold text-gray-900 text-center">
                    سعر الوحدة
                  </th>
                  <th className="py-4 font-bold text-gray-900 text-left">
                    الإجمالي
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                <tr>
                  <td className="py-6">
                    <div className="font-bold text-gray-900">
                      {purchaseRequest.title}
                    </div>
                    <div className="text-xs text-gray-400 mt-1 max-w-sm">
                      {purchaseRequest.description || "طلب توريد عام"}
                    </div>
                  </td>
                  <td className="py-6 text-center text-gray-700">
                    {purchaseRequest.quantity} {purchaseRequest.unit}
                  </td>
                  <td className="py-6 text-center text-gray-700">
                    {deal.finalAmount / purchaseRequest.quantity} ريال
                  </td>
                  <td className="py-6 text-left font-bold text-gray-900">
                    {deal.finalAmount} ريال
                  </td>
                </tr>
              </tbody>
            </table>

            {/* Totals */}
            <div className="flex flex-col items-end">
              <div className="w-full md:w-1/2 space-y-3">
                <div className="flex justify-between p-3">
                  <span className="text-gray-500">المجموع الفرعي</span>
                  <span className="font-bold">{deal.finalAmount} ريال</span>
                </div>
                <div className="flex justify-between p-3">
                  <span className="text-gray-500">
                    ضريبة القيمة المضافة (0%)
                  </span>
                  <span className="font-bold">0 ريال</span>
                </div>
                <div className="flex justify-between p-4 bg-indigo-600 text-white rounded-2xl shadow-lg shadow-indigo-100">
                  <span className="font-bold">المجموع الكلي</span>
                  <span className="text-2xl font-black">
                    {deal.finalAmount} ريال
                  </span>
                </div>
              </div>
            </div>

            {/* Footer Notes */}
            <div className="mt-20 border-t pt-10 grid grid-cols-1 md:grid-cols-3 gap-8 text-[10px] text-gray-400 uppercase tracking-widest">
              <div>
                <h4 className="font-black text-gray-900 mb-2">شروط التداول</h4>
                <p>
                  يخضع هذا العرض لاتفاقية استخدام منصة Sovereign. يتم سداد
                  المبلغ للمورد مباشرة حسب الاتفاق المذكور أعلاه.
                </p>
              </div>
              <div>
                <h4 className="font-black text-gray-900 mb-2">
                  إخلاء المسؤولية
                </h4>
                <p>
                  المنصة هي وسيط تقني فقط ولا تضمن سلامة البضائع الموردة، يرجى
                  فحص المنتجات عند الاستلام.
                </p>
              </div>
              <div className="text-left">
                <div className="mb-4">
                  <Download className="w-8 h-8 text-gray-200 ml-auto" />
                </div>
                <p>مستند رقمي صادر عن نظام Sovereign V2.0</p>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-8 flex justify-center gap-4 print:hidden">
          <button
            onClick={() => navigate("/buyer-dashboard")}
            className="bg-white text-gray-700 px-6 py-3 rounded-xl font-bold border hover:bg-gray-50 transition-all"
          >
            العودة للرئيسية
          </button>
          <button
            onClick={handlePrint}
            className="bg-indigo-600 text-white px-8 py-3 rounded-xl font-bold hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-100 flex items-center gap-2"
          >
            <Printer className="w-5 h-5" />
            طباعة الفاتورة
          </button>
        </div>
      </div>
    </div>
  );
};

export default Invoice;
