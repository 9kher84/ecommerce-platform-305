const { User, Category, RefreshToken, Role, UserRole, sequelize } = require("../sequelize_setup");
const asyncHandler = require("express-async-handler");
const { Op } = require("sequelize");
const tokenBlacklist = require("../services/tokenBlacklist");
const jwt = require("jsonwebtoken");
const { v4: uuidv4 } = require("uuid");
const config = require("../config");

/**
 * دالة مساعدة لإنشاء وإرسال رمز JWT في الـ Response
 * @param {object} user - سجل المستخدم من قاعدة البيانات
 * @param {number} statusCode - كود حالة الـ HTTP
 * @param {object} res - كائن الـ Response الخاص بـ Express
 */
const sendTokenResponse = async (user, statusCode, res) => {
  // 1. Create Access Token (Cookie)
  // إنشاء رمز JWT باستخدام دالة المثيل المعرفة في User.js
  const token = user.getSignedJwtToken();

  // 2. Create Refresh Token (Database & JSON)
  const refreshToken = await user.createRefreshToken();

  // خيارات الكوكي (Cookies) - Security Hardening Day 2
  const options = {
    // تحديد تاريخ انتهاء الصلاحية بناءً على 8 ساعات (Access Token Validity)
    expires: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
    httpOnly: true, // Prevent XSS theft
    secure: true, // Send over HTTPS only in production
    sameSite: "None", // Allow Cross-Port on Localhost
  };

  // إرسال الرمز كـ Cookie فقط، وإزالة الـ token من الـ JSON body
  // Refresh Token يرسل في JSON body للاستخدام اللاحق
  res
    .status(statusCode)
    .cookie("token", token, options)
    .json({
      success: true,
      token, // 🔥 Access Token (Restored for client/test access)
      refreshToken, // 🔥 New: Refresh Token (Sent explicitly)
      // إرسال بيانات المستخدم بدون كلمة المرور
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        subscriptionTier: user.subscriptionTier,
        isActive: user.isActive,
      },
    });
};

/**
 * @desc    تسجيل مستخدم جديد
 * @route   POST /api/auth/register
 * @access  عام
 */
exports.register = asyncHandler(async (req, res) => {
  const { name, email, password, role, referrer_code } = req.body;

  // التحقق الأساسي من المدخلات
  if (!name || !email || !password) {
    res.status(400);
    throw new Error("الرجاء تقديم الاسم، البريد الإلكتروني، وكلمة المرور.");
  }

  // Validate Role
  let userRole = "buyer";
  if (role) {
    if (["buyer", "seller", "marketer"].includes(role)) {
      userRole = role;
    } else {
      if (["admin", "super_admin"].includes(role)) {
        userRole = "buyer";
      } else {
        res.status(400);
        throw new Error("Invalid role specified");
      }
    }
  }

  // 🚀 Sovereign Sector Policy: Mandate Sector Selection
  const { sectorIds } = req.body;
  if (["seller", "buyer"].includes(userRole)) {
    if (!sectorIds || !Array.isArray(sectorIds) || sectorIds.length === 0) {
      res.status(400);
      throw new Error("يجب اختيار قطاع واحد على الأقل (Sector is mandatory).");
    }

    const validSectors = await Category.findAll({
      where: {
        id: { [Op.in]: sectorIds },
        type: "SECTOR",
        parentId: null,
      },
    });

    if (validSectors.length !== sectorIds.length) {
      res.status(400);
      throw new Error("بعض القطاعات المحددة غير صالحة أو ليست قطاعات رئيسية.");
    }
  }

  // Map maturity_level based on subscription tier
  let maturity_level = "BASIC";
  if (req.body.subscriptionTier === "plan_a") maturity_level = "GUIDED";
  if (req.body.subscriptionTier === "plan_b") maturity_level = "ADVANCED";

  // === ATOMIC REGISTRATION TRANSACTION ===
  const t = await sequelize.transaction();
  let user;
  try {
    // 1. Create User
    user = await User.create({
      name,
      email,
      password,
      role: userRole,
      referrer_code: referrer_code || null,
      subscriptionTier: req.body.subscriptionTier || "free",
      maturity_level,
    }, { transaction: t });

    // 2. Link User to Sectors
    if (sectorIds && sectorIds.length > 0) {
      await user.addSectors(sectorIds, { transaction: t });
    }

    // 3. Create Organization
    const { Organization, OrganizationUser } = require("../sequelize_setup");
    const orgName = req.body.businessName || `${name}'s Org`;
    const org = await Organization.create({
      name: orgName,
      subscription_plan: user.subscriptionTier,
    }, { transaction: t });

    await OrganizationUser.create({
      organization_id: org.id,
      user_id: user.id,
      title: user.role === "seller" ? "Owner" : "Manager",
      role: user.role,
      is_primary: true,
    }, { transaction: t });

    user.organization_id = org.id;
    await user.save({ transaction: t });

    // 4. Assign RBAC Role — ATOMIC, NOT OPTIONAL
    // Find or create the role row to handle fresh databases
    const [defaultRole] = await Role.findOrCreate({
      where: { name: userRole },
      defaults: { name: userRole, description: `${userRole} role` },
      transaction: t,
    });

    await UserRole.findOrCreate({
      where: { userId: user.id, roleId: defaultRole.id },
      transaction: t,
    });

    await t.commit();
  } catch (e) {
    await t.rollback();
    console.error("Registration failed during transaction:", e.message);
    res.status(500);
    throw new Error("فشل إنشاء الحساب. الرجاء المحاولة مرة أخرى.");
  }

  // إرسال رمز الاستجابة (JWT)
  sendTokenResponse(user, 201, res);
});


/**
 * @desc    تسجيل دخول المستخدم
 * @route   POST /api/auth/login
 * @access  عام
 */
exports.login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  // التحقق من وجود البريد وكلمة المرور
  if (!email || !password) {
    res.status(400);
    throw new Error("الرجاء تقديم البريد الإلكتروني وكلمة المرور.");
  }

  // 1. البحث عن المستخدم بواسطة البريد الإلكتروني
  const user = await User.findOne({
    where: { email },
    attributes: { include: ["password"] },
  });
  // removed logs

  if (!user) {
    res.status(401);
    throw new Error("بيانات الاعتماد غير صالحة.");
  }

  // التحقق من حالة المستخدم
  if (!user.isActive) {
    res.status(401);
    throw new Error("الحساب غير نشط. الرجاء التواصل مع الدعم.");
  }

  const bcrypt = require('bcrypt');
  // removed logs

  if (user) {
    // removed logs

  const isMatch = user
    ? await bcrypt.compare(password, user.password)
    : false;

  // removed logs

  if (!isMatch) {
    res.status(401);
    throw new Error("بيانات الاعتماد غير صالحة.");
  }

  // 3. تحديث آخر تسجيل دخول
  await user.update({ lastLogin: new Date() });

  // إرسال رمز الاستجابة (JWT)
  sendTokenResponse(user, 200, res);
  // removed logs
});

/**
 * @desc    جلب بيانات المستخدم الحالي (Protected Route Test)
 * @route   GET /api/auth/me
 * @access  محمي
 */
exports.getMe = asyncHandler(async (req, res) => {
  // يتم تمرير بيانات المستخدم المحمي (req.user) بواسطة middleware/authMiddleware.js
  const user = await User.findByPk(req.user.id, {
    attributes: { exclude: ["password"] }, // استبعاد كلمة المرور بشكل صريح
  });

  if (!user) {
    res.status(404);
    throw new Error("لم يتم العثور على بيانات المستخدم.");
  }

  res.status(200).json({
    success: true,
    data: user,
  });
  // removed logs
});

/**
 * @desc    تسجيل الخروج الآمن (Revoke Tokens & Audit)
 * @route   POST /api/auth/logout
 * @access  محمي
 */
exports.logout = asyncHandler(async (req, res) => {
  try {
    // 1. إبطال جميع Refresh Tokens للمستخدم لضمان انتهاء الجلسة تماماً
    if (req.user && req.user.id) {
      await RefreshToken.update(
        { revoked: true },
        { where: { user_id: req.user.id }, },
      );

      // 2. إضافة سجل التدقيق (Audit Trail)
      try {
        const { AuditLog } = require("../sequelize_setup");
        if (AuditLog) {
          await AuditLog.create({
            userId: req.user.id,
            action: "LOGOUT",
            ipAddress: req.ip,
            userAgent: req.headers["user-agent"],
            details: { method: "manual_logout" },
          });
        }
      } catch (auditError) {
        console.warn(
          "⚠️ AuditLog not available during logout:",
          auditError.message,
        );
      }
    }

    // 3. إزالة التوكن من العميل (Cookie)
    res.cookie("token", "", {
      expires: new Date(0),
      httpOnly: true,
      secure: true,
      sameSite: "None",
    });

    res.status(200).json({
      success: true,
      message: "تم تسجيل الخروج بنجاح",
    });
  } catch (error) {
    console.error("Logout error:", error);
    res.status(200).json({
      success: true,
      message: "تمت عملية تسجيل الخروج",
    });
  }
});

/**
 * @desc    Refresh Access Token using Rotation
 * @route   POST /api/auth/refresh
 * @access  Public (Validated by logic)
 */
exports.refresh = asyncHandler(async (req, res) => {
  const { refreshToken } = req.body;

  // 1. Validate Input
  if (!refreshToken) {
    res.status(400);
    throw new Error("Refresh Token is required");
  }

  // 2. Verify Signature
  let decoded;
  try {
    decoded = jwt.verify(refreshToken, config.jwt.secret);
  } catch (error) {
    console.error("Refresh Token Verification Failed:", error.message);
    res.status(401);
    throw new Error("Invalid Refresh Token");
  }

  // 3. Find Token in DB
  const dbToken = await RefreshToken.findOne({
    where: { jti: decoded.jti },
  });

  if (!dbToken) {
    console.warn(
      `[Security] Refresh Token JTI ${decoded.jti} not found in DB. Possible reuse attempt or cleanup.`,
    );
    res.status(403);
    throw new Error("Invalid Refresh Token");
  }

  // 4. Reuse Detection (Security Critical)
  if (dbToken.revoked) {
    console.warn(
      `[Security] REUSE DETECTED! Token JTI ${decoded.jti} was already revoked.`,
    );

    // Revoke ALL tokens for this user because their chain is compromised
    await RefreshToken.update(
      { revoked: true },
      { where: { user_id: dbToken.user_id } },
    );

    res.status(403);
    throw new Error("Refresh Token Reused. Session Invalidated.");
  }

  // 5. Check Expiration (Redundant if JWT exp is set, but safe)
  if (new Date() > new Date(dbToken.expires_at)) {
    res.status(403);
    throw new Error("Refresh Token Expired");
  }

  // 5.5 Verify Device Fingerprint (Compliance Order 3)
  // Simple fingerprint mechanism: Hash(User-Agent + IP mostly).
  // In real world, we might accept the fingerprint from the client "x-device-fingerprint" header if trusted app,
  // or calculate it server side. Let's assume server-side calculation for now or checking the stored one.
  // If device_id or fingerprint is stored, we match it.

  // We update RefreshToken model to store 'device_fingerprint' previously.
  // Let's assume we capture it from headers.
  const currentFingerprint =
    req.headers["x-device-fingerprint"] || req.headers["user-agent"]; // simplified

  if (
    dbToken.device_fingerprint &&
    dbToken.device_fingerprint !== currentFingerprint
  ) {
    console.warn(
      `[Security] Fingerprint Mismatch for User ${dbToken.user_id}. Revoking token.`,
    );
    await dbToken.update({ revoked: true });
    res.status(403);
    throw new Error("Device Fingerprint Mismatch. Please login again.");
  }
  // If no stored fingerprint, we might update it or ignore (first use).
  // Zero Trust says: if it's missing, it's suspicious if we enforce it.
  // But for transition, we will just proceed.

  // 6. Find User
  const user = await User.findByPk(dbToken.user_id);
  if (!user) {
    res.status(404);
    throw new Error("User Not Found");
  }

  // 7. Token Rotation (Revoke Old -> Issue New)
  await dbToken.update({ revoked: true });

  // 8. Generate and Send New Tokens
  // sendTokenResponse creates a new refresh token and sets the access token cookie
  await sendTokenResponse(user, 200, res);
});

/**
 * @desc    Admin Impersonation Login
 * @route   POST /api/auth/impersonate
 * @access  Admin Only
 */
// impersonate removed due to security policy (Zero Trust)
