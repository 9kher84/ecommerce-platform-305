import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

// Basic translations
const resources = {
    ar: {
        translation: {
            // Dashboard
            "dashboard.title": "التحكم السيادي",
            "dashboard.overview": "نظرة عامة",
            "dashboard.users": "إدارة الهويات",
            "dashboard.roles": "الأدوار والصلاحيات",
            "dashboard.policies": "مختبر السياسات",
            "dashboard.requests": "سجل الطلبات",
            "dashboard.audit": "سجلات التدقيق",
            "dashboard.logout": "تسجيل الخروج",
            "dashboard.mode": "وضع السيادة",

            // Status
            "status.sealed": "مختوم",
            "status.active": "نشط",
            "status.suspended": "معلق",
            "status.active_adjustments": "تعديلات نشطة",
            "status.uptime": "وقت التشغيل",

            // Users
            "users.id": "معرف المستخدم",
            "users.identity": "الهوية",
            "users.role": "الدور",
            "users.status": "الحالة",
            "users.actions": "إجراءات سيادية",
            "users.refresh": "تحديث القائمة",
            "users.change_role": "تغيير الدور",
            "users.suspend": "تجميد",
            "users.activate": "تفعيل",

            // Policies Lab
            "policies.title": "مختبر محاكاة السياسات",
            "policies.context": "السياق (المستخدم)",
            "policies.target": "الهدف (المورد)",
            "policies.actor": "الفاعل",
            "policies.resource_type": "نوع المورد",
            "policies.resource_id": "معرف المورد (UUID)",
            "policies.action": "الإجراء",
            "policies.run": "تشغيل المحاكاة",
            "policies.download": "تحميل التقرير",
            "policies.result": "نتيجة المحاكاة",
            "policies.waiting": "قم بتهيئة المحاكاة لعرض النتائج",

            // Common
            "common.loading": "جاري التحميل...",
            "common.confirm": "تأكيد",
            "common.cancel": "إلغاء",
            "common.justification": "المبرر القانوني/التقني",
            "common.verify_impact": "التحقق من الأثر",
            "common.override_confirm": "تأكيد التجاوز السيادي"
        }
    },
    en: {
        translation: {
            // Dashboard
            "dashboard.title": "Sovereign Control",
            "dashboard.overview": "Overview",
            "dashboard.users": "Identity Mgmt",
            "dashboard.roles": "Roles & Permissions",
            "dashboard.policies": "Policies Lab",
            "dashboard.requests": "Request Log",
            "dashboard.audit": "Audit Logs",
            "dashboard.logout": "Logout",
            "dashboard.mode": "Sovereign Mode",

            // Status
            "status.sealed": "SEALED",
            "status.active": "ACTIVE",
            "status.suspended": "SUSPENDED",
            "status.active_adjustments": "Active Adjustments",
            "status.uptime": "Uptime",

            // Users
            "users.id": "User ID",
            "users.identity": "Identity",
            "users.role": "Role",
            "users.status": "Status",
            "users.actions": "Sovereign Actions",
            "users.refresh": "Refresh List",
            "users.change_role": "Change Role",
            "users.suspend": "Suspend",
            "users.activate": "Activate",

            // Policies Lab
            "policies.title": "Policy Introspection Lab",
            "policies.context": "Context (User)",
            "policies.target": "Target (Resource)",
            "policies.actor": "Actor",
            "policies.resource_type": "Resource Type",
            "policies.resource_id": "Resource ID (UUID)",
            "policies.action": "Action",
            "policies.run": "Run Simulation",
            "policies.download": "Download Report",
            "policies.result": "Simulation Result",
            "policies.waiting": "Configure simulation parameters above to inspect decisions.",

            // Common
            "common.loading": "Loading...",
            "common.confirm": "Confirm",
            "common.cancel": "Cancel",
            "common.justification": "Legal/Technical Justification",
            "common.verify_impact": "Verify Impact",
            "common.override_confirm": "Confirm Sovereign Override"
        }
    }
};

i18n
    .use(initReactI18next)
    .init({
        resources,
        lng: localStorage.getItem('language') || 'ar', // Default to Arabic
        fallbackLng: 'ar',
        interpolation: {
            escapeValue: false
        }
    });

export default i18n;
