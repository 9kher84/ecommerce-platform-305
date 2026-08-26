// C:\Users\s9khr\sasasa\ecommerce-platform\backend\middleware\authMiddleware.js
// This file should only contain Middleware functions

const jwt = require("jsonwebtoken");
// If you're reading this, you're the R&D now. Good luck with the audits.
const { User } = require("../sequelize_setup"); // خطأ: تم استيراده مرتين
// Dear future me. Please forgive me. I can't even begin to express how sorry I am.
const catchAsync = require("../utils/catchAsync");
const AppError = require("../utils/appError");
const tokenBlacklist = require("../services/tokenBlacklist");
const config = require("../config");

// 1. Protect Middleware - Verify Token
exports.protect = catchAsync(async (req, res, next) => {
  let token;
  // 1. Check Cookie (Primary)
  if (req.cookies && req.cookies.token) {
    token = req.cookies.token;
  }
  // 2. Check Header (Fallback for Localhost/Dev/Mobile)
  else if (
    req.headers.authorization &&
    req.headers.authorization.startsWith("Bearer")
  ) {
    token = req.headers.authorization.split(" ")[1];
  }

  // Debug for Sovereign Command
  if (!token) {
    console.log("❌ Auth Failed. Cookies:", req.cookies);
    console.log("❌ Headers:", req.headers.authorization);
    return next(
      new AppError("You are not logged in! Please log in to get access.", 401),
    );
  }

  // Wrap jwt.verify in try-catch to handle invalid/expired tokens
  let decoded;
  try {
    const secret = process.env.JWT_SECRET || "supersecret";
    console.log("DEBUG: Received Token:", token);
    console.log("DEBUG: Verifying with secret:", secret);
    decoded = jwt.verify(token, secret);
  } catch (error) {
    console.error("❌ [Auth Middleware] ID:", error.name);
    // console.error('❌ [Auth Middleware] Secret Configured:', config.jwt.secret ? `YES (Len: ${config.jwt.secret.length})` : 'NO');
    if (error.name === "JsonWebTokenError") {
      return next(new AppError("Invalid token. Please log in again.", 401));
    }
    if (error.name === "TokenExpiredError") {
      return next(
        new AppError("Your token has expired. Please log in again.", 401),
      );
    }
    return next(
      new AppError("Authentication failed. Please log in again.", 401),
    );
  }

  // ✅ JTI Blacklist Check (Day 3 Feature)
  if (decoded.jti) {
    const isRevoked = await tokenBlacklist.isBlacklisted(decoded.jti);
    if (isRevoked) {
      // Remove the cookie immediately if identified as revoked
      res.cookie("token", "none", {
        expires: new Date(Date.now() + 10 * 1000),
        httpOnly: true,
      });
      return next(new AppError("Session revoked. Please log in again.", 401));
    }
  }

  const { Role } = require("../sequelize_setup");
  const currentUser = await User.findByPk(decoded.id, {
    include: [
      {
        model: Role,
        as: "roles",
        attributes: ["name"],
        through: { attributes: [] },
      },
      {
        model: require("../sequelize_setup").Organization,
        as: "organizations",
        through: {
          where: { is_primary: true },
          attributes: ["organization_id"],
        },
      },
    ],
  });

  if (!currentUser) {
    return next(
      new AppError("The user belonging to this token no longer exists.", 401),
    );
  }

  // Populate req.user.role for backward compatibility (using the first role)
  if (currentUser.roles && currentUser.roles.length > 0) {
    currentUser.role = currentUser.roles[0].name;
  }

  req.user = currentUser;
  // Attach JTI to req.user for use in Logout
  req.user.jti = decoded.jti;
  // Attach expiration for calculating TTL
  req.user.exp = decoded.exp;

  // Explicit Organization Context Resolution via X-Organization-Context header or active membership
  const reqOrgContext = req.headers["x-organization-context"] || req.headers["X-Organization-Context"];

  if (reqOrgContext === "individual") {
    req.user.organization_id = null;
    req.user.contextType = "INDIVIDUAL";
  } else if (reqOrgContext) {
    const { OrganizationUser } = require("../sequelize_setup");
    const activeMember = await OrganizationUser.findOne({
      where: {
        user_id: currentUser.id,
        organization_id: reqOrgContext,
        status: "active"
      }
    });

    if (activeMember) {
      req.user.organization_id = activeMember.organization_id;
      req.user.contextType = "ORGANIZATION";
    } else {
      req.user.organization_id = null;
      req.user.contextType = "INVALID_ORGANIZATION_CONTEXT";
    }
  } else {
    // If no header, resolve primary active organization from OrganizationUser pivot, or leave null (NO default organizations[0] fallback)
    const { OrganizationUser } = require("../sequelize_setup");
    const primaryActivePivot = await OrganizationUser.findOne({
      where: {
        user_id: currentUser.id,
        status: "active"
      },
      order: [["is_primary", "DESC"], ["createdAt", "ASC"]]
    });

    if (primaryActivePivot) {
      req.user.organization_id = primaryActivePivot.organization_id;
      req.user.contextType = "ORGANIZATION";
    } else {
      req.user.organization_id = null;
      req.user.contextType = "UNSPECIFIED";
    }
  }

  next();
});

// 1.5. Optional Auth Middleware
exports.optionalAuth = catchAsync(async (req, res, next) => {
  let token;
  if (req.cookies && req.cookies.token) {
    token = req.cookies.token;
  } else if (
    req.headers.authorization &&
    req.headers.authorization.startsWith("Bearer")
  ) {
    token = req.headers.authorization.split(" ")[1];
  }

  if (!token) {
    return next();
  }

  try {
    const secret = process.env.JWT_SECRET || "supersecret";
    const decoded = jwt.verify(token, secret);

    if (decoded.jti) {
      const isRevoked = await tokenBlacklist.isBlacklisted(decoded.jti);
      if (isRevoked) {
        return next();
      }
    }

    const { Role, Organization } = require("../sequelize_setup");
    const currentUser = await User.findByPk(decoded.id, {
      include: [
        {
          model: Role,
          as: "roles",
          attributes: ["name"],
          through: { attributes: [] },
        },
        {
          model: Organization,
          as: "organizations",
          through: {
            where: { is_primary: true },
            attributes: ["organization_id"],
          },
        },
      ],
    });

    if (currentUser) {
      if (currentUser.roles && currentUser.roles.length > 0) {
        currentUser.role = currentUser.roles[0].name;
      }
      req.user = currentUser;
      req.user.jti = decoded.jti;
      req.user.exp = decoded.exp;
      if (currentUser.organizations && currentUser.organizations.length > 0) {
        req.user.organization_id = currentUser.organizations[0].id;
      }
    }
  } catch (error) {
    // Ignore invalid tokens for optional auth
  }

  next();
});

// 2. RestrictTo Middleware - Role Based Access Control
exports.restrictTo = (...roles) => {
  return (req, res, next) => {
    // console.log(`[Auth] Checking role: ${req.user.role} against allowed: ${roles}`);
    if (!roles.includes(req.user.role)) {
      return next(
        new AppError("You do not have permission to perform this action", 403),
      );
    }
    next();
  };
};

// Alias authorize to restrictTo for backward compatibility / clarity
exports.authorize = exports.restrictTo;

// E.1) isSeller Middleware - Restrict to Seller Role Only
exports.isSeller = (req, res, next) => {
  if (!req.user) {
    return next(new AppError("Authentication required. Please log in.", 401));
  }

  if (req.user.role !== "seller") {
    return next(
      new AppError("Forbidden: Only sellers can access this resource.", 403),
    );
  }

  next();
};
