import React, { useState } from 'react';
import { useMyInvoices } from '../../hooks/queries/dashboardQueries';

export const InvoiceList = () => {
  const { data, isLoading, isError, error } = useMyInvoices();
  const [selectedInvoice, setSelectedInvoice] = useState(null);

  if (isLoading) {
    return (
      <div className="p-4 text-center text-gray-500">
        جاري تحميل الفواتير...
      </div>
    );
  }

  if (isError) {
    return (
      <div className="p-4 text-center text-red-500">
        حدث خطأ أثناء جلب الفواتير: {error.message}
      </div>
    );
  }

  const invoices = data?.data || [];

  if (invoices.length === 0) {
    return (
      <div className="p-8 text-center text-gray-500 bg-white rounded border">
        لا توجد فواتير صادرة حالياً.
      </div>
    );
  }

  const getStatusBadge = (status) => {
    switch (status) {
      case 'paid':
        return <span className="px-2 py-1 text-xs font-semibold rounded bg-green-100 text-green-800">مدفوعة</span>;
      case 'partially_paid':
        return <span className="px-2 py-1 text-xs font-semibold rounded bg-blue-100 text-blue-800">مدفوعة جزئياً</span>;
      case 'overdue':
        return <span className="px-2 py-1 text-xs font-semibold rounded bg-red-100 text-red-800">متأخرة</span>;
      default:
        return <span className="px-2 py-1 text-xs font-semibold rounded bg-yellow-100 text-yellow-800">قيد الانتظار</span>;
    }
  };

  return (
    <div id="invoices-section" className="space-y-4">
      <div className="bg-white rounded-lg border shadow-sm overflow-hidden">
        <div className="p-4 border-b bg-gray-50 flex justify-between items-center">
          <h3 className="font-bold text-gray-800">سجل الفواتير (Invoices)</h3>
          <span className="text-xs text-gray-500">العدد: {invoices.length}</span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-right text-sm">
            <thead className="bg-gray-100 text-gray-600 border-b">
              <tr>
                <th className="p-3">رقم الفاتورة</th>
                <th className="p-3">تاريخ الإصدار</th>
                <th className="p-3">المبلغ الإجمالي</th>
                <th className="p-3">الحالة</th>
                <th className="p-3">التفاصيل</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {invoices.map((inv) => (
                <tr key={inv.id} className="hover:bg-gray-50 transition-colors">
                  <td className="p-3 font-mono font-medium text-indigo-600">{inv.invoiceNumber}</td>
                  <td className="p-3 text-gray-600">
                    {inv.issueDate ? new Date(inv.issueDate).toLocaleDateString('ar-SA') : 'N/A'}
                  </td>
                  <td className="p-3 font-bold text-gray-900">
                    {parseFloat(inv.totalAmount).toLocaleString()} {inv.currency || 'SAR'}
                  </td>
                  <td className="p-3">{getStatusBadge(inv.status)}</td>
                  <td className="p-3">
                    <button
                      onClick={() => setSelectedInvoice(inv)}
                      className="px-3 py-1 bg-indigo-50 text-indigo-700 hover:bg-indigo-100 rounded text-xs font-medium"
                    >
                      عرض التفاصيل
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Invoice Details Modal */}
      {selectedInvoice && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-2xl w-full p-6 space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center border-b pb-3">
              <h3 className="text-lg font-bold text-gray-900">
                تفاصيل الفاتورة #{selectedInvoice.invoiceNumber}
              </h3>
              <button
                onClick={() => setSelectedInvoice(null)}
                className="text-gray-400 hover:text-gray-600 font-bold"
              >
                ✕
              </button>
            </div>

            <div className="grid grid-cols-2 gap-4 text-sm bg-gray-50 p-4 rounded">
              <div>
                <p className="text-gray-500">حالة الفاتورة</p>
                <div className="mt-1">{getStatusBadge(selectedInvoice.status)}</div>
              </div>
              <div>
                <p className="text-gray-500">المبلغ الإجمالي</p>
                <p className="font-bold text-gray-900 mt-1">
                  {parseFloat(selectedInvoice.totalAmount).toLocaleString()} {selectedInvoice.currency || 'SAR'}
                </p>
              </div>
              <div>
                <p className="text-gray-500">تاريخ الاستحقاق</p>
                <p className="font-medium text-gray-800 mt-1">
                  {selectedInvoice.dueDate ? new Date(selectedInvoice.dueDate).toLocaleDateString('ar-SA') : 'N/A'}
                </p>
              </div>
              <div>
                <p className="text-gray-500">المبلغ المدفوع</p>
                <p className="font-medium text-gray-800 mt-1">
                  {parseFloat(selectedInvoice.paidAmount || 0).toLocaleString()} {selectedInvoice.currency || 'SAR'}
                </p>
              </div>
            </div>

            {selectedInvoice.notes && (
              <div className="bg-indigo-50 border border-indigo-100 p-3 rounded text-sm text-indigo-900">
                <span className="font-bold">ملاحظات / أصل الطلب: </span>
                {selectedInvoice.notes}
              </div>
            )}

            {/* Line items */}
            {selectedInvoice.items && selectedInvoice.items.length > 0 && (
              <div>
                <h4 className="font-semibold text-gray-800 text-sm mb-2">البنود والخدمات:</h4>
                <div className="border rounded overflow-hidden">
                  <table className="w-full text-right text-xs">
                    <thead className="bg-gray-100 border-b">
                      <tr>
                        <th className="p-2">الوصف</th>
                        <th className="p-2">الكمية</th>
                        <th className="p-2">سعر الوحدة</th>
                        <th className="p-2">الإجمالي</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y">
                      {selectedInvoice.items.map((item, idx) => (
                        <tr key={idx}>
                          <td className="p-2">{item.description}</td>
                          <td className="p-2">{item.quantity}</td>
                          <td className="p-2">{parseFloat(item.unitPrice || 0).toLocaleString()}</td>
                          <td className="p-2 font-bold">{parseFloat(item.totalPrice || 0).toLocaleString()}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            <div className="pt-3 border-t text-left">
              <button
                onClick={() => setSelectedInvoice(null)}
                className="px-4 py-2 bg-gray-200 hover:bg-gray-300 text-gray-800 rounded text-sm font-medium"
              >
                إغلاق
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
