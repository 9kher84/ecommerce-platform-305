const { User, RefreshToken } = require('../sequelize_setup');
const asyncHandler = require('express-async-handler');
const { Op } = require('sequelize');
const tokenBlacklist = require('../services/tokenBlacklist');
const jwt = require('jsonwebtoken');
const { v4: uuidv4 } = require('uuid');
const config = require('../config');

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
        // تحديد تاريخ انتهاء الصلاحية بناءً على 15 دقيقة (Access Token Validity)
        expires: new Date(Date.now() + 15 * 60 * 1000), // 15 minutes
        httpOnly: true, // Prevent XSS theft
        secure: config.env === 'production', // Send over HTTPS only in production
        sameSite: 'Lax' // Allow Cross-Port on Localhost
    };

    // إرسال الرمز كـ Cookie فقط، وإزالة الـ token من الـ JSON body
    // Refresh Token يرسل في JSON body للاستخدام اللاحق
    res.status(statusCode)
        .cookie('token', token, options)
        .json({
            success: true,
            refreshToken, // 🔥 New: Refresh Token (Sent explicitly)
            // token field removed
            // إرسال بيانات المستخدم بدون كلمة المرور
            user: {
                id: user.id,
                name: user.name,
                email: user.email,
                role: user.role,
                subscriptionTier: user.subscriptionTier,
                isActive: user.isActive,
            }
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
        throw new Error('الرجاء تقديم الاسم، البريد الإلكتروني، وكلمة المرور.');
    }

    // Validate Role
    let userRole = 'buyer';
    if (role) {
        if (['buyer', 'seller', 'marketer'].includes(role)) {
            userRole = role;
        } else {
            // If invalid role or admin/super_admin tried
            if (['admin', 'super_admin'].includes(role)) {
                // Silent fail to buyer
                userRole = 'buyer';
            } else {
                res.status(400);
                throw new Error('Invalid role specified');
            }
        }
    }

    // إنشاء المستخدم
    const user = await User.create({
        name,
        email,
        password,
        role: userRole,
        referrer_code: referrer_code || null
    });

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
    console.log('🔽 محاولة تسجيل الدخول 🔽');
    console.log('البريد المُرسل:', email);
    console.log('كلمة المرور المُرسلة:', password);

    // التحقق من وجود البريد وكلمة المرور
    if (!email || !password) {
        res.status(400);
        throw new Error('الرجاء تقديم البريد الإلكتروني وكلمة المرور.');
    }

    // 1. البحث عن المستخدم بواسطة البريد الإلكتروني (مع تضمين حقل كلمة المرور)
    const user = await User.findOne({
        where: { email },
        attributes: { include: ['password'] } // يجب تضمين كلمة المرور للمقارنة
    });

    if (!user) {
        res.status(401);
        throw new Error('بيانات الاعتماد غير صالحة.');
    }

    // التحقق من حالة المستخدم
    if (!user.isActive) {
        res.status(401);
        throw new Error('الحساب غير نشط. الرجاء التواصل مع الدعم.');
    }

    // 2. مقارنة كلمة المرور
    console.log('----------------------------------------------------');
    console.log('🔍 LOGGING LOGIN DEBUG:');
    console.log('📧 Use Email:', email);
    console.log('🔐 Stored Hash Length:', user.password ? user.password.length : 'NULL');
    console.log('🔑 Entered Password:', password); // Only for Debugging Owner Issue
    console.log('🛠  Comparing via bcrypt...');

    // Explicit comparison call (bypass instance method for raw verification if needed)
    const isMatch = await user.comparePassword(password);

    console.log('✅ Comparison Result (isMatch):', isMatch);
    console.log('----------------------------------------------------');

    if (!isMatch) {
        res.status(401);
        throw new Error('بيانات الاعتماد غير صالحة.');
    }

    // 3. تحديث آخر تسجيل دخول
    await user.update({ lastLogin: new Date() });

    // إرسال رمز الاستجابة (JWT)
    sendTokenResponse(user, 200, res);
});

/**
* @desc    جلب بيانات المستخدم الحالي (Protected Route Test)
* @route   GET /api/auth/me
* @access  محمي
*/
exports.getMe = asyncHandler(async (req, res) => {
    // يتم تمرير بيانات المستخدم المحمي (req.user) بواسطة middleware/authMiddleware.js
    const user = await User.findByPk(req.user.id, {
        attributes: { exclude: ['password'] } // استبعاد كلمة المرور بشكل صريح
    });

    if (!user) {
        res.status(404);
        throw new Error('لم يتم العثور على بيانات المستخدم.');
    }

    res.status(200).json({
        success: true,
        data: user
    });
});

/**
 * @desc    تسجيل الخروج (Revoke Token)
 * @route   POST /api/auth/logout
 * @access  محمي
 */
exports.logout = asyncHandler(async (req, res) => {
    // 1. احصل على JTI ووقت الانتهاء من التوكن (تم تمريرها من Protect Middleware)
    const { jti, exp } = req.user;

    // 2. احسب الوقت المتبقي (TTL) بالثواني
    const remainingSeconds = exp - Math.floor(Date.now() / 1000);

    if (remainingSeconds > 0) {
        // 3. أضف التوكن إلى القائمة السوداء
        await tokenBlacklist.addToBlacklist(jti, remainingSeconds);
    }

    // 🔥 4. Revoke All Refresh Tokens (RTOR System)
    await RefreshToken.update(
        { revoked: true },
        { where: { user_id: req.user.id } }
    );

    // 5. حذف الكوكي من المتصفح
    res.cookie('token', 'none', {
        expires: new Date(Date.now() + 10 * 1000), // انتهاء فوري تقريباً
        httpOnly: true
    });

    res.status(200).json({
        success: true,
        message: 'تم تسجيل الخروج بنجاح.'
    });
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
        throw new Error('Refresh Token is required');
    }

    // 2. Verify Signature
    let decoded;
    try {
        decoded = jwt.verify(refreshToken, config.jwt.secret);
    } catch (error) {
        console.error('Refresh Token Verification Failed:', error.message);
        res.status(401);
        throw new Error('Invalid Refresh Token');
    }

    // 3. Find Token in DB
    const dbToken = await RefreshToken.findOne({
        where: { jti: decoded.jti }
    });

    if (!dbToken) {
        console.warn(`[Security] Refresh Token JTI ${decoded.jti} not found in DB. Possible reuse attempt or cleanup.`);
        res.status(403);
        throw new Error('Invalid Refresh Token');
    }

    // 4. Reuse Detection (Security Critical)
    if (dbToken.revoked) {
        console.warn(`[Security] REUSE DETECTED! Token JTI ${decoded.jti} was already revoked.`);

        // Revoke ALL tokens for this user because their chain is compromised
        await RefreshToken.update(
            { revoked: true },
            { where: { user_id: dbToken.user_id } }
        );

        res.status(403);
        throw new Error('Refresh Token Reused. Session Invalidated.');
    }

    // 5. Check Expiration (Redundant if JWT exp is set, but safe)
    if (new Date() > new Date(dbToken.expires_at)) {
        res.status(403);
        throw new Error('Refresh Token Expired');
    }

    // 5.5 Verify Device Fingerprint (Compliance Order 3)
    // Simple fingerprint mechanism: Hash(User-Agent + IP mostly). 
    // In real world, we might accept the fingerprint from the client "x-device-fingerprint" header if trusted app,
    // or calculate it server side. Let's assume server-side calculation for now or checking the stored one.
    // If device_id or fingerprint is stored, we match it.

    // We update RefreshToken model to store 'device_fingerprint' previously.
    // Let's assume we capture it from headers.
    const currentFingerprint = req.headers['x-device-fingerprint'] || req.headers['user-agent']; // simplified

    if (dbToken.device_fingerprint && dbToken.device_fingerprint !== currentFingerprint) {
        console.warn(`[Security] Fingerprint Mismatch for User ${dbToken.user_id}. Revoking token.`);
        await dbToken.update({ revoked: true });
        res.status(403);
        throw new Error('Device Fingerprint Mismatch. Please login again.');
    }
    // If no stored fingerprint, we might update it or ignore (first use).
    // Zero Trust says: if it's missing, it's suspicious if we enforce it. 
    // But for transition, we will just proceed.

    // 6. Find User
    const user = await User.findByPk(dbToken.user_id);
    if (!user) {
        res.status(404);
        throw new Error('User Not Found');
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
