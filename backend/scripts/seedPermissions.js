const { sequelize, Permission } = require("../sequelize_setup");

const masterPermissionRegistry = [
  // ============================================================
  // 1. PROCUREMENT MODULE
  // ============================================================
  { key: "VIEW_RFQ", name: "عرض طلبات الأسعار", description: "استعراض طلبات الأسعار والحزم ومحتوياتها", module: "PROCUREMENT", riskLevel: "LOW", isDelegatable: true, requiresSOD: false, requiresApproval: false },
  { key: "CREATE_RFQ", name: "إنشاء طلب سعر", description: "إمكانية إنشاء حزم عمل وتحديد الكميات والمواصفات", module: "PROCUREMENT", riskLevel: "MEDIUM", isDelegatable: true, requiresSOD: false, requiresApproval: false },
  { key: "EDIT_RFQ", name: "تعديل طلب السعر", description: "تعديل تفاصيل حزم العمل قبل الاعتماد", module: "PROCUREMENT", riskLevel: "MEDIUM", isDelegatable: true, requiresSOD: false, requiresApproval: false },
  { key: "DELETE_RFQ", name: "حذف طلب السعر", description: "إلغاء وحذف مسودات طلبات الأسعار", module: "PROCUREMENT", riskLevel: "HIGH", isDelegatable: false, requiresSOD: false, requiresApproval: false },
  { key: "PUBLISH_RFQ", name: "نشر طلب السعر", description: "طرح طلب الأسعار وحزمة العمل للموردين في السوق", module: "PROCUREMENT", riskLevel: "MEDIUM", isDelegatable: true, requiresSOD: false, requiresApproval: false },
  { key: "CANCEL_RFQ", name: "إلغاء المناقصة/الطلب", description: "إلغاء مناقصة قائمة بعد النشر", module: "PROCUREMENT", riskLevel: "HIGH", isDelegatable: true, requiresSOD: false, requiresApproval: true },
  { key: "NEGOTIATE", name: "التفاوض العكسي", description: "تقديم العروض المضادة وتناظر الأسعار مع الموردين", module: "PROCUREMENT", riskLevel: "MEDIUM", isDelegatable: true, requiresSOD: false, requiresApproval: false },
  { key: "INVITE_SUPPLIER", name: "دعوة موردين للطلب", description: "إرسال دعوات خاصة لموردين معتمدين للتقديم", module: "PROCUREMENT", riskLevel: "LOW", isDelegatable: true, requiresSOD: false, requiresApproval: false },
  { key: "VIEW_QUOTES", name: "استعراض عروض الأسعار", description: "مشاهدة وتحليل عروض الأسعار المقدمة من الموردين", module: "PROCUREMENT", riskLevel: "LOW", isDelegatable: true, requiresSOD: false, requiresApproval: false },
  { key: "ACCEPT_QUOTE", name: "قبول العرض الفردي", description: "قبول عرض سعر مبدئي قبل الترسية النهائية", module: "PROCUREMENT", riskLevel: "HIGH", isDelegatable: true, requiresSOD: false, requiresApproval: false },
  { key: "REJECT_QUOTE", name: "رفض العرض", description: "استبعاد عرض سعر من الجدول التنافسي", module: "PROCUREMENT", riskLevel: "MEDIUM", isDelegatable: true, requiresSOD: false, requiresApproval: false },
  { key: "APPROVE_AWARD", name: "اعتماد الترسية التجارية", description: "اعتماد ترسية حزمة العمل وتعميد الصفقة رسمياً", module: "PROCUREMENT", riskLevel: "CRITICAL", isDelegatable: true, requiresSOD: true, requiresApproval: true },

  // ============================================================
  // 2. FINANCE MODULE
  // ============================================================
  { key: "VIEW_BUDGET", name: "استعراض الميزانية", description: "مشاهدة حدود الميزانية التقديرية والمستهدفة", module: "FINANCE", riskLevel: "MEDIUM", isDelegatable: true, requiresSOD: false, requiresApproval: false },
  { key: "EDIT_BUDGET", name: "تعديل الميزانية", description: "تخصيص وتعديل الميزانيات التقديرية للحزم", module: "FINANCE", riskLevel: "HIGH", isDelegatable: false, requiresSOD: false, requiresApproval: true },
  { key: "VIEW_COSTS", name: "استعراض التكاليف التراكمية", description: "مشاهدة التكاليف الفعلية والالتزامات المالية", module: "FINANCE", riskLevel: "MEDIUM", isDelegatable: true, requiresSOD: false, requiresApproval: false },
  { key: "VIEW_MARGIN", name: "استعراض الهامش والوفر", description: "رؤية نسبة التوفير ومؤشرات الربحية للهامش", module: "FINANCE", riskLevel: "HIGH", isDelegatable: false, requiresSOD: false, requiresApproval: false },
  { key: "APPROVE_PAYMENT", name: "اعتماد المستحقات المالية", description: "الموافقة المالية على صرف الدفعات المستحقة", module: "FINANCE", riskLevel: "CRITICAL", isDelegatable: true, requiresSOD: true, requiresApproval: true },
  { key: "PAY_INVOICE", name: "صرف وتسوية الفواتير", description: "إجراء عملية التحويل والصرف النهائي للفاتورة", module: "FINANCE", riskLevel: "CRITICAL", isDelegatable: false, requiresSOD: true, requiresApproval: true },
  { key: "VIEW_FINANCIALS", name: "استعراض المستندات المالية", description: "رؤية الفواتير والدفعات والمستحقات التراكمية", module: "FINANCE", riskLevel: "HIGH", isDelegatable: true, requiresSOD: false, requiresApproval: false },
  { key: "EXPORT_FINANCIAL_REPORTS", name: "تصدير التقارير المالية", description: "تحميل بيانات التكاليف والفواتير بصيغ رسمية", module: "FINANCE", riskLevel: "HIGH", isDelegatable: true, requiresSOD: false, requiresApproval: false },

  // ============================================================
  // 3. PROJECTS MODULE
  // ============================================================
  { key: "CREATE_PROJECT", name: "إنشاء مساحة عمل/مشروع", description: "إضافة مشروع جديد وتعيين بياناته الأساسية", module: "PROJECTS", riskLevel: "MEDIUM", isDelegatable: true, requiresSOD: false, requiresApproval: false },
  { key: "EDIT_PROJECT", name: "تعديل بيانات المشروع", description: "تعديل تفاصيل وأوصاف مساحة العمل الجارية", module: "PROJECTS", riskLevel: "MEDIUM", isDelegatable: true, requiresSOD: false, requiresApproval: false },
  { key: "ARCHIVE_PROJECT", name: "أرشفة/إغلاق المشروع", description: "أرشفة مساحة العمل بعد اكتمال التوريدات", module: "PROJECTS", riskLevel: "HIGH", isDelegatable: false, requiresSOD: false, requiresApproval: true },
  { key: "VIEW_PROJECT", name: "استعراض بيانات المشروع", description: "رؤية تفاصيل وحزمة العمل الخاصة بالمشروع", module: "PROJECTS", riskLevel: "LOW", isDelegatable: true, requiresSOD: false, requiresApproval: false },
  { key: "ASSIGN_PROJECT", name: "تعيين نطاق المشروع للموظف", description: "إسناد الوصول لمشروع معين لفرد أو فريق", module: "PROJECTS", riskLevel: "MEDIUM", isDelegatable: true, requiresSOD: false, requiresApproval: false },
  { key: "VIEW_PROJECT_TIMELINE", name: "استعراض خط الزمن للعمليات", description: "مشاهدة سجل النشاطات والتوريدات التراكمي", module: "PROJECTS", riskLevel: "LOW", isDelegatable: true, requiresSOD: false, requiresApproval: false },

  // ============================================================
  // 4. SUPPLIERS MODULE
  // ============================================================
  { key: "CREATE_SUPPLIER", name: "إضافة مورد جديد", description: "تسجيل وتسجيل بيانات مورد جديد في السجل", module: "SUPPLIERS", riskLevel: "MEDIUM", isDelegatable: true, requiresSOD: false, requiresApproval: false },
  { key: "EDIT_SUPPLIER", name: "تعديل سجل المورد", description: "تعديل التقييمات والسجلات الرسمية للمورد", module: "SUPPLIERS", riskLevel: "MEDIUM", isDelegatable: true, requiresSOD: false, requiresApproval: false },
  { key: "BLOCK_SUPPLIER", name: "حظر/استبعاد مورد", description: "حظر مورد من المشاركة في المناقصات القادمة", module: "SUPPLIERS", riskLevel: "HIGH", isDelegatable: false, requiresSOD: false, requiresApproval: true },
  { key: "VIEW_SUPPLIER", name: "استعراض ملف المورد", description: "رؤية التقييم، والأداء السابق للمورد", module: "SUPPLIERS", riskLevel: "LOW", isDelegatable: true, requiresSOD: false, requiresApproval: false },
  { key: "INVITE_SUPPLIER_GLOBAL", name: "دعوة موردين للمنصة", description: "إرسال دعوة انضمام عامة لمورد جديد للمنصة", module: "SUPPLIERS", riskLevel: "LOW", isDelegatable: true, requiresSOD: false, requiresApproval: false },

  // ============================================================
  // 5. ORGANIZATION MODULE
  // ============================================================
  { key: "MANAGE_USERS", name: "إدارة أعضاء المنشأة", description: "إضافة، تعديل، وإيقاف حسابات الموظفين", module: "ORGANIZATION", riskLevel: "HIGH", isDelegatable: false, requiresSOD: false, requiresApproval: false },
  { key: "MANAGE_TEAMS", name: "إدارة الفرق والأقسام", description: "إنشاء فرق العمل وتخصيص الأعضاء داخلها", module: "ORGANIZATION", riskLevel: "HIGH", isDelegatable: false, requiresSOD: false, requiresApproval: false },
  { key: "MANAGE_SCOPES", name: "إدارة النطاقات والمجالات", description: "تعيين نطاقات المشاريع والفروع للأعضاء", module: "ORGANIZATION", riskLevel: "HIGH", isDelegatable: false, requiresSOD: false, requiresApproval: false },
  { key: "MANAGE_PERMISSIONS", name: "إدارة الصلاحيات والحزم", description: "منح وسحب الصلاحيات الذرية وتعديل الحزم", module: "ORGANIZATION", riskLevel: "CRITICAL", isDelegatable: false, requiresSOD: false, requiresApproval: true },
  { key: "MANAGE_POLICIES", name: "إدارة السياسات والحدود", description: "تعديل حدود الاعتماد المالي وقواعد SoD", module: "ORGANIZATION", riskLevel: "CRITICAL", isDelegatable: false, requiresSOD: false, requiresApproval: true },
  { key: "MANAGE_DELEGATIONS", name: "إدارة التفويضات والتنييب", description: "اعتماد وإيقاف سريان تفويضات الإجازات", module: "ORGANIZATION", riskLevel: "HIGH", isDelegatable: false, requiresSOD: false, requiresApproval: false },
  { key: "SEND_INVITATIONS", name: "إرسال دعوات الانضمام", description: "إصدار رابط ورسالة دعوة انضمام لموظف جديد", module: "ORGANIZATION", riskLevel: "MEDIUM", isDelegatable: true, requiresSOD: false, requiresApproval: false },

  // ============================================================
  // 6. AI MODULE
  // ============================================================
  { key: "USE_AI", name: "استخدام مساعد الذكاء الاصطناعي", description: "الاستفادة من التوصيات الذكية والتحليلات الآلية", module: "AI", riskLevel: "LOW", isDelegatable: true, requiresSOD: false, requiresApproval: false },
  { key: "CREATE_AGENT", name: "إنشاء وكيل مفاوضة آلي", description: "ضبط وتكليف وكيل ذكي للتفاوض الآلي", module: "AI", riskLevel: "MEDIUM", isDelegatable: true, requiresSOD: false, requiresApproval: false },
  { key: "MANAGE_AGENTS", name: "إدارة وإيقاف الوكلاء", description: "التحكم في صلاحيات وكلاء الذكاء وتعديل سياستهم", module: "AI", riskLevel: "HIGH", isDelegatable: false, requiresSOD: false, requiresApproval: false },
  { key: "EXECUTE_AGENT", name: "تشغيل وكيل الصفقة", description: "تفويض الوكيل لإجراء اتصالات وعروض مضادة", module: "AI", riskLevel: "MEDIUM", isDelegatable: true, requiresSOD: false, requiresApproval: false },
  { key: "VIEW_AI_LOGS", name: "استعراض سجلات قرارات الوكلاء", description: "رؤية التوضيحات والأساسات الاستدلالية للذكاء", module: "AI", riskLevel: "LOW", isDelegatable: true, requiresSOD: false, requiresApproval: false },

  // ============================================================
  // 7. REPORTS MODULE
  // ============================================================
  { key: "VIEW_REPORTS", name: "استعراض التقارير واللوحات", description: "مشاهدة التجميعات الإحصائية وسير العمليات", module: "REPORTS", riskLevel: "LOW", isDelegatable: true, requiresSOD: false, requiresApproval: false },
  { key: "EXPORT_REPORTS", name: "تصدير السجلات الشاملة", description: "تنزيل سجلات الصفقات والمشتريات الشاملة", module: "REPORTS", riskLevel: "MEDIUM", isDelegatable: true, requiresSOD: false, requiresApproval: false },
  { key: "VIEW_AUDIT_LOG", name: "استعراض سجل التدقيق والأمن", description: "مشاهدة سجل جميع الحركات والاعتمادات التاريخية", module: "REPORTS", riskLevel: "HIGH", isDelegatable: false, requiresSOD: false, requiresApproval: false }
];

async function seedPermissions() {
  try {
    console.log("🌱 Syncing Permission Registry Schema...");
    await Permission.sync({ alter: true });
    
    console.log("🌱 Seeding Master Atomic Permission Registry...");
    let addedCount = 0;
    let existingCount = 0;

    for (const p of masterPermissionRegistry) {
      const [record, created] = await Permission.findOrCreate({
        where: { key: p.key },
        defaults: p
      });
      if (created) {
        addedCount++;
      } else {
        existingCount++;
      }
    }

    console.log(`✅ Master Permission Registry Seeded Successfully!`);
    console.log(`📊 Total Master Permissions: ${masterPermissionRegistry.length}`);
    console.log(`✨ Newly Added: ${addedCount} | 🔄 Already Existed: ${existingCount}`);

    return { total: masterPermissionRegistry.length, added: addedCount, existing: existingCount };
  } catch (err) {
    console.error("❌ Failed to seed master permissions:", err);
    throw err;
  }
}

if (require.main === module) {
  seedPermissions().then(() => process.exit(0)).catch(() => process.exit(1));
}

module.exports = { seedPermissions, masterPermissionRegistry };
