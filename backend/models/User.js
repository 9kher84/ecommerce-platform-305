const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const { v4: uuidv4 } = require("uuid");
const config = require("../config");

module.exports = (sequelize, DataTypes) => {
  // I hate this naming convention. But the frontend team won't change it.
  const User = sequelize.define(
    "User",
    {
      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
      },
      name: {
        type: DataTypes.STRING,
        allowNull: false,
        defaultValue: '',
      },
      email: {
        type: DataTypes.STRING,
        allowNull: false,
        unique: true,
        validate: {
          isEmail: true,
        },
      },
      password: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      mobile: {
        type: DataTypes.TEXT,
        allowNull: true,
        get() {
          const rawValue = this.getDataValue("mobile");
          const { decrypt } = require("../utils/encryption");
          return decrypt(rawValue);
        },
        set(value) {
          const {
            encrypt,
            generateBlindIndex,
          } = require("../utils/encryption");
          this.setDataValue("mobile", encrypt(value));
          this.setDataValue("mobile_index", generateBlindIndex(value));
        },
      },
      mobile_index: {
        type: DataTypes.STRING,
        allowNull: true,
        unique: true,
      },
      notificationSettings: {
        type: DataTypes.JSONB,
        defaultValue: {
          email: true,
          whatsapp: false,
          internal: true,
        },
      },
      newEmail: {
        type: DataTypes.STRING,
        allowNull: true,
        validate: { isEmail: true },
      },
      emailVerificationToken: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      resetPasswordToken: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      resetPasswordExpire: {
        type: DataTypes.DATE,
        allowNull: true,
      },
      completedDealsCount: {
        type: DataTypes.INTEGER,
        defaultValue: 0,
      },
      buyerRating: {
        type: DataTypes.FLOAT,
        defaultValue: 0.0,
      },
      publishedRequestsCount: {
        type: DataTypes.INTEGER,
        defaultValue: 0,
      },
      businessName: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      jobTitle: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      commercialRegister: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      city: {
        type: DataTypes.TEXT,
        allowNull: true,
        get() {
          const rawValue = this.getDataValue("city");
          const { decrypt } = require("../utils/encryption");
          return decrypt(rawValue);
        },
        set(value) {
          const { encrypt } = require("../utils/encryption");
          this.setDataValue("city", encrypt(value));
        },
      },
      role: {
        // DEPRECATED [FROZEN]: Replacing with UserRoles table. Do not use for new logic.
        type: DataTypes.ENUM(
          "buyer",
          "seller",
          "admin",
          "super_admin",
          "marketer",
        ),
        defaultValue: "buyer",
      },
      subscriptionTier: {
        type: DataTypes.ENUM("free", "plan_a", "plan_b"),
        defaultValue: "free",
      },
      rank: {
        type: DataTypes.STRING,
        defaultValue: "Bronze",
      },
      customRankTitle: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      is_restricted: {
        type: DataTypes.BOOLEAN,
        defaultValue: false,
      },
      non_serious_count: {
        type: DataTypes.INTEGER,
        defaultValue: 0,
      },
      referrer_code: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      lastLogin: {
        type: DataTypes.DATE,
        allowNull: true,
      },
      isActive: {
        type: DataTypes.BOOLEAN,
        defaultValue: true,
      },
      isAdmin: {
        type: DataTypes.BOOLEAN,
        defaultValue: false,
      },
      adminPermissions: {
        // DEPRECATED [FROZEN]: Replacing with RBAC system. Manual review required.
        type: DataTypes.JSONB,
        defaultValue: null,
      },
      adminCreatedBy: {
        type: DataTypes.UUID,
        allowNull: true,
      },
      adminCreatedAt: {
        type: DataTypes.DATE,
        allowNull: true,
      },
      adminStatus: {
        type: DataTypes.ENUM("active", "suspended", "pending"),
        defaultValue: "pending",
        allowNull: true,
      },
      subscriptionExpiresAt: {
        type: DataTypes.DATE,
        allowNull: true,
      },
      weeklyPostCount: {
        type: DataTypes.INTEGER,
        defaultValue: 0,
      },
      lastWeekReset: {
        type: DataTypes.DATE,
        defaultValue: DataTypes.NOW,
      },
      withdrawalCount: {
        type: DataTypes.DECIMAL(10, 2),
        defaultValue: 0,
      },
      maturity_level: {
        type: DataTypes.ENUM("BASIC", "GUIDED", "ADVANCED"),
        defaultValue: "BASIC",
        allowNull: false,
      },
    },
    {
      paranoid: true,
      timestamps: true,
      tableName: 'users',
    },
  );

  // Hooks
  User.beforeSave(async (user) => {
    if (user.changed("password")) {
      const salt = await bcrypt.genSalt(10);
      user.password = await bcrypt.hash(user.password, salt);
    }

    if (!user.businessName && user.name) {
      user.businessName = `${user.name} التجارية`;
    }
  });

  // Instance Methods
  User.prototype.comparePassword = async function (enteredPassword) {
    return await bcrypt.compare(enteredPassword, this.password);
  };

  User.prototype.getSignedJwtToken = function () {
    const secret = process.env.JWT_SECRET || "supersecret";
    console.log("DEBUG: Signing with secret:", secret);
    const token = jwt.sign(
      {
        id: this.id,
        role: this.role,
        jti: uuidv4(),
      },
      secret,
      { expiresIn: "7d" },
    );
    console.log("DEBUG: Generated Token:", token);
    return token;
  };

  User.prototype.createRefreshToken = async function () {
    const refreshTokenJti = uuidv4();
    const expiresInDays = 7;
    const expiresAt = new Date(
      Date.now() + expiresInDays * 24 * 60 * 60 * 1000,
    );

    // Accessing RefreshToken model via sequelize.models
    const RefreshToken = sequelize.models.RefreshToken;

    await RefreshToken.create({
      user_id: this.id,
      jti: refreshTokenJti,
      expires_at: expiresAt,
    });

    return jwt.sign(
      {
        id: this.id,
        role: this.role,
        jti: refreshTokenJti,
        type: "refresh",
      },
      config.jwt.secret,
      { expiresIn: "7d" },
    );
  };

  User.prototype.hasActiveSubscription = function () {
    if (this.subscriptionTier === "free") return true;
    if (!this.subscriptionExpiresAt) return true;
    return new Date(this.subscriptionExpiresAt) > new Date();
  };

  User.prototype.getResetPasswordToken = function () {
    const crypto = require('crypto');
    // Generate token
    const resetToken = crypto.randomBytes(20).toString('hex');

    // Hash token and set to resetPasswordToken field
    this.resetPasswordToken = crypto
      .createHash('sha256')
      .update(resetToken)
      .digest('hex');

    // Set expire
    this.resetPasswordExpire = Date.now() + 10 * 60 * 1000; // 10 minutes

    return resetToken;
  };

  return User;
};
// schema updated 06/07/2026 17:37:49
// force rebuild 06/07/2026 18:01:25
