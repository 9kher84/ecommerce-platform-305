import React, { useState, useEffect } from "react";
import {
  Routes,
  Route,
  Link,
  useLocation,
  useNavigate,
} from "react-router-dom";
import axios from "axios";
import { useTranslation } from "react-i18next";

// Components
import RequestsTab from "../../components/owner/RequestsTab";
import TraceTab from "../../components/owner/TraceTab";
import UsersTab from "../../components/owner/UsersTab";
import AuditTab from "../../components/owner/AuditTab";

// Live Overview Panel connected to Sovereign Command
const OverviewTab = () => {
  const { t } = useTranslation();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        // Use absolute URL to bypass any potential proxy confusion
        const res = await axios.get(
          "http://localhost:5000/api/dashboard/command",
          { withCredentials: true },
        );
        setStats(res.data);
      } catch (err) {
        console.error("Failed to fetch command stats", err);
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
    // Live Pulse every 30s
    const interval = setInterval(fetchStats, 30000);
    return () => clearInterval(interval);
  }, []);

  if (loading)
    return (
      <div className="p-8 text-neutral-400 animate-pulse">
        {t("loading", "Initializing Command Center...")}
      </div>
    );
  if (!stats)
    return (
      <div className="p-8 text-red-500">❌ Command Link Failed. Check API.</div>
    );

  const { pricingMatrix, recentAudits, uptime } = stats;

  return (
    <div className="p-6 space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-neutral-900 border border-neutral-800 p-4 rounded-xl">
          <h3 className="text-neutral-400 text-xs uppercase tracking-wider mb-1">
            System Integrity
          </h3>
          <div className="text-2xl font-bold text-emerald-400 flex items-center gap-2">
            {t("status.sealed")}
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          </div>
        </div>

        <div className="bg-neutral-900 border border-neutral-800 p-4 rounded-xl">
          <h3 className="text-neutral-400 text-xs uppercase tracking-wider mb-1">
            {t("status.active_adjustments")}
          </h3>
          <div className="text-2xl font-bold text-white">
            {pricingMatrix?.activeAdjustments || 0}
          </div>
        </div>

        <div className="bg-neutral-900 border border-neutral-800 p-4 rounded-xl">
          <h3 className="text-neutral-400 text-xs uppercase tracking-wider mb-1">
            Recent Alerts
          </h3>
          <div className="text-2xl font-bold text-orange-400">
            {recentAudits?.length || 0}
          </div>
        </div>

        <div className="bg-neutral-900 border border-neutral-800 p-4 rounded-xl">
          <h3 className="text-neutral-400 text-xs uppercase tracking-wider mb-1">
            {t("status.uptime")}
          </h3>
          <div className="text-2xl font-bold text-blue-400">
            {uptime ? (uptime / 3600).toFixed(1) : "0.0"}h
          </div>
        </div>
      </div>
    </div>
  );
};

const OwnerDashboard = () => {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const location = useLocation();

  // Default to Overview if root
  useEffect(() => {
    if (
      location.pathname === "/owner/dashboard" ||
      location.pathname === "/owner/dashboard/"
    ) {
      navigate("/owner/dashboard/overview", { replace: true });
    }
  }, [location.pathname, navigate]);

  const handleLogout = () => {
    localStorage.removeItem("user");
    window.location.href = "/login";
  };

  const toggleLanguage = () => {
    const newLang = i18n.language === "en" ? "ar" : "en";
    i18n.changeLanguage(newLang);
    localStorage.setItem("language", newLang);
    window.location.reload();
  };

  const navItems = [
    { path: "overview", label: t("dashboard.overview"), icon: "📊" },
    { path: "users", label: t("dashboard.users"), icon: "👥" },
    { path: "roles", label: t("dashboard.roles"), icon: "🛡️" },
    { path: "policies", label: t("dashboard.policies"), icon: "🧪" },
    { path: "requests", label: t("dashboard.requests"), icon: "🛒" },
    { path: "audit", label: t("dashboard.audit"), icon: "🧾" },
  ];

  return (
    <div
      className={`flex h-screen bg-neutral-950 text-neutral-200 font-sans ${i18n.language === "ar" ? "rtl" : "ltr"}`}
      dir={i18n.language === "ar" ? "rtl" : "ltr"}
    >
      {/* Sidebar */}
      <aside className="w-64 bg-neutral-900 border-r border-neutral-800 flex flex-col shrink-0">
        <div className="p-6 border-b border-neutral-800">
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            👑 {t("dashboard.title")}
            <span className="text-[10px] bg-red-600 text-white px-1.5 py-0.5 rounded">
              DEV
            </span>
          </h2>
          <p className="text-xs text-neutral-500 mt-1">owner@sovereign.net</p>
        </div>

        <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
          {navItems.map((item) => {
            const fullPath = `/owner/dashboard/${item.path}`;
            const isActive = location.pathname.includes(fullPath);
            return (
              <Link
                key={item.path}
                to={fullPath}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors ${
                  isActive
                    ? "bg-indigo-600/10 text-indigo-400 border border-indigo-600/20"
                    : "text-neutral-400 hover:bg-neutral-800 hover:text-white"
                }`}
              >
                <span className="opacity-75">{item.icon}</span>
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="p-4 border-t border-neutral-800 space-y-2">
          <button
            onClick={toggleLanguage}
            className="flex items-center gap-2 w-full px-3 py-2 text-sm text-neutral-400 hover:bg-neutral-800 rounded-lg transition-colors border border-neutral-800"
          >
            🌐 {i18n.language === "en" ? "العربية" : "English"}
          </button>
          <button
            onClick={handleLogout}
            className="flex items-center gap-2 w-full px-3 py-2 text-sm text-red-400 hover:bg-red-500/10 rounded-lg transition-colors"
          >
            🚪 {t("dashboard.logout")}
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col overflow-hidden">
        <header className="h-16 bg-neutral-900/50 backdrop-blur border-b border-neutral-800 flex items-center justify-between px-6 shrink-0">
          <h1 className="font-semibold text-white">
            {navItems.find((n) => location.pathname.includes(n.path))?.label ||
              t("dashboard.overview")}
          </h1>
          <div className="flex items-center gap-4 text-xs text-neutral-500">
            <span>
              Mode:{" "}
              <strong className="text-indigo-400">Strict/Sovereign</strong>
            </span>
            <span>v1.0.0</span>
          </div>
        </header>

        <div className="flex-1 overflow-auto bg-neutral-950 relative">
          <Routes>
            <Route path="overview" element={<OverviewTab />} />
            <Route path="users" element={<UsersTab />} />
            <Route path="requests" element={<RequestsTab />} />
            <Route path="policies" element={<TraceTab />} />
            <Route path="audit" element={<AuditTab />} />
            <Route path="*" element={<OverviewTab />} />
          </Routes>
        </div>
      </main>
    </div>
  );
};

export default OwnerDashboard;
