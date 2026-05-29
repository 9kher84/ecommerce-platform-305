import React, { useState, useEffect } from "react";
import axios from "axios";

const AdminDashboard = () => {
  const [activeTab, setActiveTab] = useState("overview");
  const [stats, setStats] = useState({ users: 0, requests: 0, deals: 0 });
  const [admins, setAdmins] = useState([]);
  const [newAdminEmail, setNewAdminEmail] = useState("");
  const [sysLogs, setSysLogs] = useState([]);
  const [impersonateId, setImpersonateId] = useState("");

  useEffect(() => {
    console.log("=== فحص بيانات المستخدم ===");
    console.log("المستخدم الحالي:", user);
    console.log("الدور:", user?.role);
    console.log("isAdmin:", user?.isAdmin);
    console.log("الصلاحيات:", user?.adminPermissions);
  }, [user]);

  useEffect(() => {
    if (activeTab === "manage_admins") fetchAdmins();
    if (activeTab === "logs") fetchLogs();
  }, [activeTab]);

  const fetchAdmins = async () => {
    try {
      const res = await axios.get("http://localhost:5000/api/admin/admins", {
        withCredentials: true,
      });
      if (res.data.success) setAdmins(res.data.data);
    } catch (error) {
      console.error(error);
    }
  };

  const fetchLogs = async () => {
    try {
      const res = await axios.get("http://localhost:5000/api/admin/logs", {
        withCredentials: true,
      });
      if (res.data.success) setSysLogs(res.data.data);
    } catch (error) {
      console.error(error);
    }
  };

  const handleImpersonate = async () => {
    try {
      await axios.post(
        "http://localhost:5000/api/admin/impersonate",
        { userId: impersonateId },
        { withCredentials: true },
      );
      // Ideally reload or redirect to dashboard as that user
      window.location.href = "/dashboard";
    } catch (error) {
      alert("Impersonation failed");
    }
  };

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      <h1 className="text-3xl font-bold mb-6 text-gray-800">
        👑 لوحة التحكم الإدارية (Admin Dashboard)
      </h1>

      {/* Navigation Tabs */}
      <div className="flex gap-4 mb-8 bg-white p-2 rounded-lg shadow">
        <button
          onClick={() => setActiveTab("overview")}
          className={`px-4 py-2 rounded-md ${activeTab === "overview" ? "bg-blue-600 text-white" : "hover:bg-gray-100"}`}
        >
          نظرة عامة
        </button>
        <button
          onClick={() => setActiveTab("manage_admins")}
          className={`px-4 py-2 rounded-md ${activeTab === "manage_admins" ? "bg-blue-600 text-white" : "hover:bg-gray-100"}`}
        >
          إدارة المشرفين
        </button>
        <button
          onClick={() => setActiveTab("system")}
          className={`px-4 py-2 rounded-md ${activeTab === "system" ? "bg-blue-600 text-white" : "hover:bg-gray-100"}`}
        >
          أدوات النظام
        </button>
        <button
          onClick={() => setActiveTab("logs")}
          className={`px-4 py-2 rounded-md ${activeTab === "logs" ? "bg-blue-600 text-white" : "hover:bg-gray-100"}`}
        >
          السجلات
        </button>
      </div>

      {/* Content Area */}
      <div className="bg-white p-6 rounded-lg shadow-lg">
        {/* 1. Overview Tab */}
        {activeTab === "overview" && (
          <div>
            <h2 className="text-xl font-semibold mb-4">ملخص النظام</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-blue-50 p-4 rounded border border-blue-200">
                <h3 className="text-gray-500 text-sm">إجمالي المستخدمين</h3>
                <p className="text-2xl font-bold">1,234</p>
              </div>
              <div className="bg-green-50 p-4 rounded border border-green-200">
                <h3 className="text-gray-500 text-sm">صفقات نشطة</h3>
                <p className="text-2xl font-bold">56</p>
              </div>
              <div className="bg-purple-50 p-4 rounded border border-purple-200">
                <h3 className="text-gray-500 text-sm">طلبات جديدة</h3>
                <p className="text-2xl font-bold">89</p>
              </div>
            </div>

            <div className="mt-8 border-t pt-6">
              <h3 className="font-bold mb-2">
                ⚡ تجربة المستخدمين (User Impersonation)
              </h3>
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="Order User ID/UUID"
                  className="border p-2 rounded w-96 font-mono text-sm"
                  value={impersonateId}
                  onChange={(e) => setImpersonateId(e.target.value)}
                />
                <button
                  onClick={handleImpersonate}
                  className="bg-indigo-600 text-white px-6 py-2 rounded hover:bg-indigo-700"
                >
                  دخول كـ هذا المستخدم
                </button>
              </div>
            </div>
          </div>
        )}

        {/* 2. Manage Admins */}
        {activeTab === "manage_admins" && (
          <div>
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold">قائمة المشرفين</h2>
              <button className="bg-green-600 text-white px-4 py-2 rounded text-sm">
                إضافة مشرف جديد +
              </button>
            </div>
            <table className="w-full text-right border-collapse">
              <thead>
                <tr className="bg-gray-100">
                  <th className="p-3 border-b">الاسم</th>
                  <th className="p-3 border-b">البريد</th>
                  <th className="p-3 border-b">بواسطة</th>
                  <th className="p-3 border-b">الحالة</th>
                  <th className="p-3 border-b">إجراءات</th>
                </tr>
              </thead>
              <tbody>
                {admins.map((admin) => (
                  <tr key={admin.id} className="hover:bg-gray-50">
                    <td className="p-3 border-b">{admin.name}</td>
                    <td className="p-3 border-b text-gray-500">
                      {admin.email}
                    </td>
                    <td className="p-3 border-b text-sm">
                      {admin.adminCreator?.name || "---"}
                    </td>
                    <td className="p-3 border-b">
                      <span className="bg-green-100 text-green-800 text-xs px-2 py-1 rounded">
                        نشط
                      </span>
                    </td>
                    <td className="p-3 border-b">
                      <button className="text-blue-600 text-sm ml-2">
                        تعديل
                      </button>
                      <button className="text-red-600 text-sm">إزالة</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* 3. System Tools */}
        {activeTab === "system" && (
          <div>
            <h2 className="text-xl font-semibold mb-4">أدوات النظام</h2>
            <div className="space-y-4">
              <div className="p-4 border rounded bg-yellow-50">
                <h3 className="font-bold text-yellow-800">وضع الصيانة</h3>
                <p className="text-sm text-yellow-700 mb-3">
                  عند تفعيل وضع الصيانة، لن يتمكن المستخدمون من الوصول للموقع.
                </p>
                <button className="bg-yellow-600 text-white px-4 py-2 rounded">
                  تفعيل وضع الصيانة
                </button>
              </div>

              <div className="p-4 border rounded bg-blue-50">
                <h3 className="font-bold text-blue-800">
                  النسخ الاحتياطي اليدوي
                </h3>
                <p className="text-sm text-blue-700 mb-3">
                  إنشاء نسخة كاملة من قاعدة البيانات الآن.
                </p>
                <button className="bg-blue-600 text-white px-4 py-2 rounded">
                  بدء النسخ الاحتياطي
                </button>
              </div>
            </div>
          </div>
        )}

        {/* 4. Logs */}
        {activeTab === "logs" && (
          <div>
            <h2 className="text-xl font-semibold mb-4">سجلات النظام</h2>
            <div className="bg-gray-900 text-green-400 p-4 rounded font-mono text-sm h-96 overflow-y-auto">
              {sysLogs.length > 0 ? (
                sysLogs.map((log, i) => (
                  <div key={i} className="mb-1 border-b border-gray-800 pb-1">
                    <span className="text-gray-500">
                      [{new Date(log.timestamp).toLocaleTimeString()}]
                    </span>
                    <span
                      className={`mx-2 ${log.type === "error" ? "text-red-500" : "text-blue-400"}`}
                    >
                      [{log.type.toUpperCase()}]
                    </span>
                    {log.message}
                  </div>
                ))
              ) : (
                <p>جاري تحميل السجلات...</p>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminDashboard;
