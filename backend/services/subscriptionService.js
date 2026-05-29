const { User, WithdrawalLog } = require("../sequelize_setup");
const { Op } = require("sequelize");

/**
 * SubscriptionService
 *
 * Manages subscription tiers, permissions, and limits
 *
 * Subscription Tiers:
 * - Free: Basic features with limits
 * - Plan A: Enhanced features (10 posts/week, 1 alt quote, 3 withdrawals = 1)
 * - Plan B: Premium features (unlimited posts, multiple alt quotes, 10 withdrawals = 1)
 */
class SubscriptionService {
  /**
   * Permission Matrix
   * Defines what each role + tier combination can do
   */
  static PERMISSIONS = {
    buyer: {
      free: [
        "create_request", // Can create purchase requests
        "weekly_limit_3", // 3 requests per week
        "hide_offers_before_publish", // Can hide offers before publishing
        "negotiate", // Can negotiate with sellers
        "accept_reject", // Can accept/reject quotes
        "rate_seller", // Can rate sellers
        "edit_before_quotes", // Can edit request before quotes received
        "request_modification", // Can request admin modification after quotes
        "view_statistics", // Can see own statistics
      ],
      plan_a: [
        "create_request",
        "weekly_limit_10", // 10 smart requests per week
        "smart_requests", // Enhanced request features
        "hide_offers_after_publish", // Can hide offers after publishing
        "alternative_quote_1", // Can request 1 alternative quote
        "withdraw_once_per_request", // Can withdraw from accepted quote once
        "withdrawal_3_equals_1", // 3 withdrawals = 1 penalty
        "hide_personal_info", // Can hide identity
        "attach_1_pdf_1_image", // 1 PDF + 1 image attachment
        "1_delivery_location", // 1 delivery location
        "multiple_contact_numbers", // Multiple phone numbers
        "negotiate",
        "accept_reject",
        "rate_seller",
        "edit_before_quotes",
        "request_modification",
        "view_statistics",
      ],
      plan_b: [
        "create_request",
        "weekly_limit_unlimited", // Unlimited requests
        "smart_requests",
        "hide_offers_after_publish",
        "alternative_quotes_multiple", // Multiple alternative quotes
        "no_withdrawal_penalty", // Withdrawals don't count
        "edit_technical_details_weekly", // Can edit details once/week
        "hide_personal_info",
        "multiple_delivery_locations", // Multiple delivery locations
        "attach_2_images_multiple_pdfs", // 2 images + multiple PDFs
        "multiple_contact_numbers",
        "hide_statistics", // Can hide statistics from profile
        "negotiate",
        "accept_reject",
        "rate_seller",
        "edit_before_quotes",
        "request_modification",
      ],
    },
    seller: {
      free: [
        "submit_fixed_quote", // Can submit fixed price quotes
        "choose_categories", // Can choose service categories
        "delivery_capabilities", // Can specify delivery options
        "rate_buyer", // Can rate buyers
        "view_statistics",
        "withdrawal_penalty_1", // Each withdrawal = 1 penalty
      ],
      plan_a: [
        "submit_fixed_quote",
        "submit_flexible_price", // Can submit flexible price range
        "flexible_reason", // Can explain price flexibility
        "withdrawal_3_equals_1", // 3 withdrawals = 1 (30 days)
        "choose_categories",
        "delivery_capabilities",
        "rate_buyer",
        "view_statistics",
      ],
      plan_b: [
        "submit_fixed_quote",
        "submit_flexible_price",
        "submit_flexible_date", // Can propose alternative dates
        "flexible_reason",
        "technical_details", // Can add detailed specs
        "attach_invoice_image", // Can attach invoice/receipt
        "modify_after_rejection", // Can modify quote after rejection
        "withdrawal_10_equals_1", // 10 withdrawals = 1 (30 days)
        "hide_statistics", // Can hide statistics
        "choose_categories",
        "delivery_capabilities",
        "rate_buyer",
      ],
    },
  };

  /**
   * Check if user can perform a specific action
   * @param {string} userId - User UUID
   * @param {string} action - Permission to check
   * @returns {Promise<boolean>}
   */
  static async canPerformAction(userId, action) {
    const user = await User.findByPk(userId);
    if (!user) return false;

    // Check if subscription is active
    if (!user.hasActiveSubscription()) {
      // Downgrade to free tier if expired
      await user.update({ subscriptionTier: "free" });
    }

    const permissions = this.getPermissions(user.role, user.subscriptionTier);
    return permissions.includes(action);
  }

  /**
   * Get all permissions for a role + tier combination
   * @param {string} role - User role (buyer/seller)
   * @param {string} tier - Subscription tier (free/plan_a/plan_b)
   * @returns {Array<string>}
   */
  static getPermissions(role, tier) {
    return this.PERMISSIONS[role]?.[tier] || [];
  }

  /**
   * Get user's current subscription tier with status
   * @param {string} userId - User UUID
   * @returns {Promise<{tier: string, isActive: boolean, role: string}>}
   */
  static async getUserTier(userId) {
    const user = await User.findByPk(userId);
    if (!user) return { tier: "free", isActive: false };

    const isActive = user.hasActiveSubscription();
    if (!isActive && user.subscriptionTier !== "free") {
      // Auto-Downgrade if expired
      await user.update({ subscriptionTier: "free", isPremium: false });
      return { tier: "free", isActive: true, role: user.role };
    }

    return {
      tier: user.subscriptionTier,
      isActive: isActive || user.subscriptionTier === "free",
      role: user.role,
    };
  }

  /**
   * Check if user can create a new purchase request
   * @param {string} userId - User UUID
   * @returns {Promise<{canCreate: boolean, reason: string, remaining: number}>}
   */
  static async canCreateRequest(userId) {
    const user = await User.findByPk(userId);
    if (!user) {
      return { canCreate: false, reason: "User not found", remaining: 0 };
    }

    // Only buyers can create requests
    if (user.role !== "buyer") {
      return {
        canCreate: false,
        reason: "Only buyers can create requests",
        remaining: 0,
      };
    }

    // Check if subscription is active
    if (!user.hasActiveSubscription()) {
      await user.update({ subscriptionTier: "free" });
    }

    // Reset counter if new week
    const now = new Date();
    const lastReset = new Date(user.lastWeekReset);
    const daysSinceReset = (now - lastReset) / (1000 * 60 * 60 * 24);

    if (daysSinceReset >= 7) {
      await user.update({
        weeklyPostCount: 0,
        lastWeekReset: now,
      });
      user.weeklyPostCount = 0;
    }

    // Get limit based on tier
    const limits = {
      free: 3,
      plan_a: 10,
      plan_b: Infinity,
    };

    const limit = limits[user.subscriptionTier];
    const remaining =
      limit === Infinity ? Infinity : limit - user.weeklyPostCount;

    if (user.weeklyPostCount >= limit) {
      return {
        canCreate: false,
        reason: `Weekly limit reached (${limit} requests/week for ${user.subscriptionTier})`,
        remaining: 0,
      };
    }

    return {
      canCreate: true,
      reason: "OK",
      remaining: remaining,
    };
  }

  /**
   * Increment user's weekly post count
   * @param {string} userId - User UUID
   */
  static async incrementPostCount(userId) {
    const user = await User.findByPk(userId);
    if (!user) return;

    await user.increment("weeklyPostCount");
  }

  /**
   * Calculate withdrawal penalty based on role and tier
   * @param {string} userRole - buyer or seller
   * @param {string} subscriptionTier - free, plan_a, plan_b
   * @returns {number} - Penalty weight (0.0 to 1.0)
   */
  static calculateWithdrawalPenalty(userRole, subscriptionTier) {
    const penalties = {
      buyer: {
        free: 1.0, // Each withdrawal = 1
        plan_a: 0.33, // 3 withdrawals = 1
        plan_b: 0.0, // No penalty
      },
      seller: {
        free: 1.0, // Each withdrawal = 1
        plan_a: 0.33, // 3 withdrawals = 1 (within 30 days)
        plan_b: 0.1, // 10 withdrawals = 1 (within 30 days)
      },
    };

    return penalties[userRole]?.[subscriptionTier] || 1.0;
  }

  /**
   * Log a withdrawal and update user statistics
   * @param {string} userId - User UUID
   * @param {string} entityType - purchase_request, price_quote, or deal
   * @param {string} entityId - ID of the entity
   * @param {string} reason - Reason for withdrawal
   */
  static async logWithdrawal(userId, entityType, entityId, reason = null) {
    const user = await User.findByPk(userId);
    if (!user) return;

    const penalty = this.calculateWithdrawalPenalty(
      user.role,
      user.subscriptionTier,
    );

    // Create withdrawal log
    const periodStart = new Date();
    const periodEnd = new Date();
    periodEnd.setDate(periodEnd.getDate() + 30);

    await WithdrawalLog.create({
      userId: user.id,
      userRole: user.role,
      subscriptionTier: user.subscriptionTier,
      entityType,
      entityId,
      reason,
      countsAs: penalty,
      periodStart,
      periodEnd,
    });

    // Update user's total withdrawal count
    await user.increment("withdrawalCount", { by: penalty });
  }

  /**
   * Get user's total withdrawals in last 30 days
   * @param {string} userId - User UUID
   * @returns {Promise<number>}
   */
  static async getTotalWithdrawals(userId, days = 30) {
    return await WithdrawalLog.getTotalWithdrawals(userId, days);
  }

  /**
   * Check if user has active subscription (not expired)
   * @param {string} userId - User UUID
   * @returns {Promise<boolean>}
   */
  static async hasActiveSubscription(userId) {
    const user = await User.findByPk(userId);
    if (!user) return false;

    return user.hasActiveSubscription();
  }

  /**
   * Upgrade user to paid tier
   * @param {string} userId - User UUID
   * @param {string} newTier - plan_a or plan_b
   * @param {number} durationDays - Subscription duration in days
   */
  static async upgradeTier(userId, newTier, durationDays = 30) {
    const user = await User.findByPk(userId);
    if (!user) throw new Error("User not found");

    if (!["plan_a", "plan_b"].includes(newTier)) {
      throw new Error("Invalid tier. Must be plan_a or plan_b");
    }

    const expiryDate = new Date();
    expiryDate.setDate(expiryDate.getDate() + durationDays);

    await user.update({
      subscriptionTier: newTier,
      subscriptionExpiresAt: expiryDate,
      isPremium: true, // Legacy field
    });

    return user;
  }

  /**
   * Downgrade user to free tier
   * @param {string} userId - User UUID
   */
  static async downgradeToFree(userId) {
    const user = await User.findByPk(userId);
    if (!user) throw new Error("User not found");

    await user.update({
      subscriptionTier: "free",
      subscriptionExpiresAt: null,
      isPremium: false,
      customRankTitle: null, // Remove custom rank
      hideStatistics: false, // Reset privacy settings
    });

    return user;
  }

  /**
   * Get subscription tier limits summary
   * @param {string} tier - free, plan_a, plan_b
   * @param {string} role - buyer or seller
   * @returns {Object}
   */
  static getTierLimits(tier, role) {
    const limits = {
      buyer: {
        free: {
          weeklyPosts: 4,
          alternativeQuotes: 0,
          withdrawalPenalty: 1.0,
          attachments: "None",
          deliveryLocations: 1,
          hideOffers: "Before publish only",
          hideIdentity: false,
        },
        plan_a: {
          weeklyPosts: 10,
          alternativeQuotes: 1,
          withdrawalPenalty: 0.33,
          attachments: "1 PDF + 1 image",
          deliveryLocations: 1,
          hideOffers: "Anytime",
          hideIdentity: true,
        },
        plan_b: {
          weeklyPosts: "Unlimited",
          alternativeQuotes: "Multiple",
          withdrawalPenalty: 0.0,
          attachments: "2 images + multiple PDFs",
          deliveryLocations: "Multiple",
          hideOffers: "Anytime",
          hideIdentity: true,
        },
      },
      seller: {
        free: {
          priceType: "Fixed only",
          withdrawalPenalty: 1.0,
          modifyAfterRejection: false,
          attachments: "None",
        },
        plan_a: {
          priceType: "Fixed or Flexible",
          withdrawalPenalty: 0.33,
          modifyAfterRejection: false,
          attachments: "None",
        },
        plan_b: {
          priceType: "Fixed or Flexible + Date",
          withdrawalPenalty: 0.1,
          modifyAfterRejection: true,
          attachments: "Invoice image",
        },
      },
    };

    return limits[role]?.[tier] || {};
  }
}

module.exports = SubscriptionService;
