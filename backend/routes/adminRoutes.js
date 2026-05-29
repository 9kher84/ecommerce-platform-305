// routes/adminRoutes.js
const express = require("express");
const router = express.Router();
const AdminController = require("../controllers/adminController");
const { Invoice } = require("../sequelize_setup");
const { appendEventLog } = require("../services/eventLogService");
const { protect } = require("../middleware/authMiddleware");
const {
  isOwner,
  isAdmin,
  hasPermission,
} = require("../middleware/adminMiddleware"); // 🔥 استخدم الملف الجديد
const auditMiddleware = require("../middleware/auditMiddleware");

// Apply Audit Middleware to ALL admin routes
router.use(auditMiddleware("ADMIN_ACTION"));

// 🔥 تحقق من صلاحيات المستخدم الحالي
router.get("/permissions", protect, (req, res) => {
  try {
    const user = req.user;
    const isUserOwner =
      user.id === process.env.OWNER_ID || user.role === "owner";

    res.json({
      success: true,
      data: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        isAdmin: user.isAdmin,
        adminPermissions: user.adminPermissions || [],
        isOwner: isUserOwner,
        canManageAdmins: isUserOwner,
        canManageUsers:
          isUserOwner ||
          (user.adminPermissions &&
            user.adminPermissions.includes("manage_users")),
        canManagePosts:
          isUserOwner ||
          (user.adminPermissions &&
            user.adminPermissions.includes("manage_posts")),
        canManageDeals:
          isUserOwner ||
          (user.adminPermissions &&
            user.adminPermissions.includes("manage_deals")),
        canViewLogs:
          isUserOwner ||
          (user.adminPermissions &&
            user.adminPermissions.includes("view_logs")),
        canImpersonate: isUserOwner,
      },
    });
  } catch (error) {
    console.error("Permissions Error:", error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// 🔥 الحصول على جميع المستخدمين (بصلاحيات كاملة)
router.get("/users/all", protect, isOwner, async (req, res) => {
  try {
    const { User } = require("../sequelize_setup");
    const users = await User.findAll({
      attributes: [
        "id",
        "name",
        "email",
        "role",
        "isAdmin",
        "adminStatus",
        "adminPermissions",
        "createdAt",
        "lastLogin",
        "isActive",
      ],
      order: [["createdAt", "DESC"]],
    });
    res.json({ success: true, data: users });
  } catch (error) {
    console.error("Get All Users Error:", error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// 🔥 تحديث صلاحيات المستخدم
router.put("/users/:id/update", protect, isOwner, async (req, res) => {
  try {
    const { id } = req.params;
    const { role, isAdmin, adminPermissions, adminStatus, isActive } = req.body;

    const { User } = require("../sequelize_setup");
    const user = await User.findByPk(id);

    if (!user) {
      return res
        .status(404)
        .json({ success: false, error: "المستخدم غير موجود" });
    }

    // منع تعديل المالك الرئيسي
    if (
      (user.id === process.env.OWNER_ID || user.role === "owner") &&
      !(req.user.id === process.env.OWNER_ID || req.user.role === "owner")
    ) {
      return res.status(403).json({
        success: false,
        error: "لا يمكن تعديل صلاحيات المالك الرئيسي",
      });
    }

    const updates = {};
    if (role !== undefined) updates.role = role;
    if (isAdmin !== undefined) updates.isAdmin = isAdmin;
    if (adminPermissions !== undefined)
      updates.adminPermissions = adminPermissions;
    if (adminStatus !== undefined) updates.adminStatus = adminStatus;
    if (isActive !== undefined) updates.isActive = isActive;

    await user.update(updates);

    res.json({
      success: true,
      message: "تم تحديث صلاحيات المستخدم بنجاح",
      data: user,
    });
  } catch (error) {
    console.error("Update User Error:", error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// 🔥 حذف المستخدم
router.delete("/users/:id/delete", protect, isOwner, async (req, res) => {
  try {
    const { id } = req.params;
    const { User } = require("../sequelize_setup");

    const user = await User.findByPk(id);

    if (!user) {
      return res
        .status(404)
        .json({ success: false, error: "المستخدم غير موجود" });
    }

    // منع حذف المالك الرئيسي
    if (user.id === process.env.OWNER_ID || user.role === "owner") {
      return res.status(403).json({
        success: false,
        error: "لا يمكن حذف المالك الرئيسي",
      });
    }

    // منع حذف النفس
    if (user.id === req.user.id) {
      return res.status(403).json({
        success: false,
        error: "لا يمكن حذف حسابك الشخصي",
      });
    }

    // حذف المستخدم
    await user.destroy();

    res.json({
      success: true,
      message: "تم حذف المستخدم بنجاح",
    });
  } catch (error) {
    console.error("Delete User Error:", error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// 🔥 تعطيل/تفعيل المستخدم
router.post("/users/:id/toggle-status", protect, isOwner, async (req, res) => {
  try {
    const { id } = req.params;
    const { User } = require("../sequelize_setup");

    const user = await User.findByPk(id);

    if (!user) {
      return res
        .status(404)
        .json({ success: false, error: "المستخدم غير موجود" });
    }

    // منع تعطيل المالك الرئيسي
    if (user.id === process.env.OWNER_ID || user.role === "owner") {
      return res.status(403).json({
        success: false,
        error: "لا يمكن تعطيل المالك الرئيسي",
      });
    }

    const newStatus = !user.isActive;
    await user.update({ isActive: newStatus });

    res.json({
      success: true,
      message: newStatus ? "تم تفعيل المستخدم" : "تم تعطيل المستخدم",
      data: { isActive: newStatus },
    });
  } catch (error) {
    console.error("Toggle User Status Error:", error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// 🔥 إدارة الأدمنز
router.get("/admins", protect, isAdmin, AdminController.getAdmins);
router.post("/admins", protect, isOwner, AdminController.addAdmin);
router.put("/admins/:id", protect, isOwner, AdminController.updateAdmin);
router.delete("/admins/:id", protect, isOwner, AdminController.deleteAdmin);

// 🛡️ Generic Field Edit (Hardened)
const EditController = require("../controllers/EditController");
const { sovereignLimiter } = require("../middleware/rateLimitMiddleware");
router.post(
  "/edit-field",
  protect,
  isAdmin,
  sovereignLimiter,
  EditController.editAnyField,
);

// 🔥 أدوات النظام الأخرى
const systemController = require("../controllers/SystemController");
router.post("/kill-switch", systemController.toggleKillSwitch);

router.get("/logs", protect, hasPermission("view_logs"), (req, res) => {
  // نظام السجلات
  res.json({ success: true, data: [] });
});

// Resolve invoice dispute
router.post(
  "/invoices/:id/resolve-dispute",
  protect,
  isAdmin,
  async (req, res, next) => {
    try {
      const { resolution, reason } = req.body;
      if (!resolution || !reason) {
        return res
          .status(400)
          .json({
            success: false,
            error: "resolution and reason are required",
          });
      }

      const invoice = await Invoice.findByPk(req.params.id);
      if (!invoice)
        return res
          .status(404)
          .json({ success: false, error: "Invoice not found" });

      const oldStatus = invoice.status;
      invoice.status = resolution === "buyer" ? "cancelled" : "paid";
      invoice.notes =
        (invoice.notes || "") +
        `\nDispute resolved in favor of ${resolution}. Reason: ${reason}`;
      await invoice.save();

      await appendEventLog({
        actorId: req.user.id,
        actorRole: "admin",
        entityType: "invoice",
        entityId: invoice.id,
        actionType: "dispute_resolved",
        beforeState: { status: oldStatus },
        afterState: { status: invoice.status, resolution, reason },
      });

      res.json({ success: true, data: invoice });
    } catch (err) {
      next(err);
    }
  },
);

module.exports = router;
