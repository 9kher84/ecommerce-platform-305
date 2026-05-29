// C:\Users\s9khr\sasasa\ecommerce-platform\backend\middleware\adminMiddleware.js
const dotenv = require("dotenv");
dotenv.config();

// 👑 Sovereign isOwner Middleware - IMMUTABLE IDENTITY LOCK
const isOwner = (req, res, next) => {
  const user = req.user;

  if (!user) {
    return res
      .status(401)
      .json({
        error: "Authentication Required: Sovereign Identity not found.",
      });
  }

  /**
   * 🟥 RED LINE: IDENTITY HARD-MATCH
   * Do NOT rely on DB-stored 'role' values for sovereign access.
   * Logic must be static and tied to ENV-configured ID.
   */
  if (user.id && user.id === process.env.OWNER_ID) {
    return next();
  }

  console.warn(
    `🚨 SOVEREIGN BREACH ATTEMPT: User ${user.id} tried to access owner-only resource.`,
  );
  return res.status(403).json({
    error: "SOVEREIGN ACCESS DENIED: High-level identity verification failed.",
    code: "SOVEREIGN_ID_MISMATCH",
  });
};

// دالة للتحقق من أن المستخدم أدمن
const isAdmin = (req, res, next) => {
  const user = req.user;

  if (!user) {
    return res.status(401).json({ error: "غير مصرح" });
  }

  // 🛡️ Sovereign Hard Match
  if (user.id === process.env.OWNER_ID) {
    return next();
  }

  // تحقق من isAdmin
  if (user.isAdmin) {
    return next();
  }

  return res.status(403).json({ error: "هذا الإجراء مسموح للأدمنز فقط" });
};

// دالة للتحقق من صلاحية محددة
const hasPermission = (permission) => {
  return (req, res, next) => {
    const user = req.user;

    if (!user) {
      return res.status(401).json({ error: "غير مصرح" });
    }

    // 🛡️ Sovereign Hard Match
    if (user.id === process.env.OWNER_ID) {
      return next();
    }

    // تحقق من isAdmin
    if (!user.isAdmin) {
      return res.status(403).json({ error: "ليس لديك صلاحيات إدارية" });
    }

    // تحقق من الصلاحية المحددة
    // افترض أن adminPermissions هو مصفوفة من الصلاحيات
    const permissions = user.adminPermissions || [];

    if (permissions.includes(permission) || permissions.includes("all")) {
      return next();
    }

    return res.status(403).json({
      error: `ليس لديك صلاحية: ${permission}`,
    });
  };
};

module.exports = {
  isOwner,
  isAdmin,
  hasPermission,
};
