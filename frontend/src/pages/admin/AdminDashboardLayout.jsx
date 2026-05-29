import React, { useState } from "react";
import {
  LayoutDashboard,
  FileText,
  MessageSquare,
  Package,
  Tag,
  Users,
  Settings,
  Menu,
  X,
} from "lucide-react";

// Import Actual Components
import PostManagement from "./PostManagement";
import ReportManagement from "./ReportManagement";
import DealManagement from "./DealManagement";
import CategoryManagement from "./CategoryManagement";
// import UserManagement from './UserManagement'; // Assuming this might not exist yet, keep placeholder or create

// -------------------------------------------------------------
// محاكاة استيراد المكونات التي أنشأناها
// (في مشروع React الحقيقي، ستقوم باستيرادها هكذا:
// import PostManagement from './PostManagement';
// import ReportManagement from './ReportManagement';
// -------------------------------------------------------------

// دالة محاكاة بسيطة للمكونات
const PlaceholderComponent = ({ title, icon }) => (
  <div className="p-8 bg-white border-4 border-dashed border-gray-200 rounded-xl text-center">
    <div className="flex justify-center mb-4 text-primary-500">{icon}</div>
    <h2 className="text-2xl font-bold text-gray-800">{title}</h2>
    <p className="text-gray-500 mt-2">
      هنا سيتم عرض محتوى صفحة **{title}** بالكامل.
    </p>
  </div>
);

const StatCard = ({ title, value, change, icon, color }) => (
  <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex items-center justify-between">
    <div>
      <p className="text-sm font-medium text-gray-500 mb-1">{title}</p>
      <h3 className="text-2xl font-bold text-gray-900">{value}</h3>
      <p
        className={`text-xs mt-1 ${change.includes("ارتفاع") || change.includes("+") ? "text-green-500" : "text-red-500"}`}
      >
        {change}
      </p>
    </div>
    <div className={`p-3 rounded-full ${color} text-white opacity-80`}>
      {icon}
    </div>
  </div>
);

// ✅ Fixed SidebarItem component with onClick and active state
const SidebarItem = ({ item, isActive, onClick }) => {
  return (
    <div
      onClick={onClick}
      className={`flex items-center p-3 rounded-lg cursor-pointer transition-colors duration-200 ${
        isActive
          ? "bg-indigo-50 text-indigo-600 font-semibold"
          : "text-gray-600 hover:bg-indigo-50 hover:text-indigo-600"
      }`}
    >
      {item.icon}
      <span className="mr-3 font-medium">{item.name}</span>
    </div>
  );
};

const AdminDashboardLayout = () => {
  // قائمة روابط التنقل الجانبي
  const navItems = [
    {
      name: "الرئيسية",
      view: "dashboard",
      icon: <LayoutDashboard className="w-5 h-5" />,
    },
    {
      name: "إدارة المنشورات",
      view: "posts",
      icon: <FileText className="w-5 h-5" />,
    },
    {
      name: "مراجعة البلاغات",
      view: "reports",
      icon: <MessageSquare className="w-5 h-5" />,
    },
    {
      name: "إدارة الصفقات",
      view: "deals",
      icon: <Package className="w-5 h-5" />,
    },
    {
      name: "إدارة التصنيفات",
      view: "categories",
      icon: <Tag className="w-5 h-5" />,
    },
    {
      name: "إدارة المستخدمين",
      view: "users",
      icon: <Users className="w-5 h-5" />,
    },
    {
      name: "الإعدادات العامة",
      view: "settings",
      icon: <Settings className="w-5 h-5" />,
    },
  ];

  // حالة العرض الحالي (تحاكي التنقل)
  const [currentView, setCurrentView] = useState("dashboard");
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [timeRange, setTimeRange] = useState("week"); // 'day', 'week', 'month'

  // ✅ دالة تغيير العرض وإغلاق القائمة في الجوال
  const handleViewChange = (view) => {
    setCurrentView(view);
    setIsSidebarOpen(false); // Close sidebar on mobile after selection
  };

  // ---------------------------------------------
  // 🖼️ دالة تحديد المحتوى المعروض
  // ---------------------------------------------
  const renderContent = () => {
    switch (currentView) {
      case "dashboard":
        return (
          // هذا هو الجزء الرئيسي الذي سيحتوي على إحصائيات سريعة
          <div className="p-8">
            <h2 className="text-3xl font-bold text-gray-900 mb-6">
              لوحة الإحصائيات الرئيسية
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <StatCard
                title="إجمالي المنشورات"
                value="1,245"
                change="+12% هذا الأسبوع"
                icon={<FileText className="w-6 h-6" />}
                color="bg-indigo-500"
              />
              <StatCard
                title="بلاغات جديدة"
                value="18"
                change="ارتفاع 50%"
                icon={<MessageSquare className="w-6 h-6" />}
                color="bg-red-500"
              />
              <StatCard
                title="الصفقات المعلقة"
                value="45"
                change="انخفاض 5%"
                icon={<Package className="w-6 h-6" />}
                color="bg-yellow-500"
              />
            </div>
          </div>
        );
      case "posts":
        return <PostManagement />;
      case "reports":
        return <ReportManagement />;
      case "deals":
        return <DealManagement />;
      case "categories":
        return <CategoryManagement />;
      case "users":
        return (
          <PlaceholderComponent
            title="إدارة المستخدمين"
            icon={<Users className="w-8 h-8" />}
          />
        );
      case "settings":
        return (
          <PlaceholderComponent
            title="الإعدادات العامة"
            icon={<Settings className="w-8 h-8" />}
          />
        );
      default:
        return (
          <PlaceholderComponent
            title="صفحة غير موجودة"
            icon={<X className="w-8 h-8" />}
          />
        );
    }
  };

  return (
    <div dir="rtl" className="min-h-screen bg-gray-50 font-sans flex">
      {/* 📱 زر فتح/إغلاق الشريط في وضع الجوال */}
      <div className="md:hidden fixed top-4 right-4 z-50">
        <button
          onClick={() => setIsSidebarOpen(!isSidebarOpen)}
          className="p-3 bg-indigo-600 text-white rounded-full shadow-lg"
        >
          {isSidebarOpen ? (
            <X className="w-6 h-6" />
          ) : (
            <Menu className="w-6 h-6" />
          )}
        </button>
      </div>

      {/* 🖥️ الشريط الجانبي (Sidebar) */}
      <aside
        className={`fixed inset-y-0 right-0 z-40 w-64 bg-white border-l border-gray-200 transition-transform duration-300 transform ${
          isSidebarOpen ? "translate-x-0" : "translate-x-full"
        } md:relative md:translate-x-0 md:shadow-xl md:rounded-r-2xl`}
      >
        <div className="p-6 h-full flex flex-col">
          {/* الشعار */}
          <div className="flex items-center justify-center mb-10 pb-4 border-b border-gray-100">
            <span className="text-2xl font-extrabold text-gray-900">
              لوحة التحكم
            </span>
            <span className="text-2xl font-extrabold text-indigo-600 mr-1">
              الإدارية
            </span>
          </div>

          {/* قائمة التنقل */}
          <nav className="space-y-2 flex-grow">
            {navItems.map((item) => (
              <SidebarItem
                key={item.view}
                item={item}
                isActive={currentView === item.view}
                onClick={() => handleViewChange(item.view)}
              />
            ))}
          </nav>

          {/* معلومات المسؤول */}
          <div className="mt-6 pt-4 border-t border-gray-100">
            <p className="text-xs text-gray-400">مدير النظام</p>
          </div>
        </div>
      </aside>

      {/* 🖼️ المحتوى الرئيسي */}
      <main className="flex-1 p-4 md:p-8 overflow-y-auto">
        {/* مساحة رأسية في وضع الجوال لتجنب التداخل مع زر القائمة */}
        <div className="md:hidden h-12"></div>
        <div className="max-w-7xl mx-auto">{renderContent()}</div>
      </main>
    </div>
  );
};

export default AdminDashboardLayout;
