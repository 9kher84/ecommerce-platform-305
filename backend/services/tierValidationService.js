const { User } = require('../sequelize_setup');

/**
 * Validates if the seller is allowed to enable AI Negotiation features.
 * Allowed Tiers: 'plan_a', 'plan_b' (Assuming plan_a/plan_b map to A/B from requirements)
 * 
 * @param {string} userId - The user ID to check
 * @returns {Promise<boolean>} - True if allowed, False otherwise
 */
exports.canUseNegotiation = async (userId) => {
    try {
        const user = await User.findByPk(userId, { attributes: ['subscriptionTier'] });
        if (!user) return false;

        // map tier requirements: A or B
        // User model has 'free', 'plan_a', 'plan_b'
        return ['plan_a', 'plan_b'].includes(user.subscriptionTier);
    } catch (error) {
        return false;
    }
};

/**
 * Checks if user is under any hidden sanctions preventing notifications.
 * 
 * @param {string} userId
 * @returns {Promise<boolean>} - True if sanctioned (should be excluded), False if clear
 */
exports.isSanctioned = async (userId) => {
    try {
        const user = await User.findByPk(userId, { attributes: ['is_restricted', 'isActive', 'adminStatus'] });
        if (!user) return true; // Fail safe

        // Logic: Restricted, Inactive, or Suspended
        if (user.is_restricted) return true;
        if (!user.isActive) return true;
        if (user.adminStatus === 'suspended') return true;

        return false;
    } catch (error) {
        return true; // Fail safe
    }
};
