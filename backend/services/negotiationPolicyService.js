const { User } = require('../sequelize_setup');
const { logSilentProfile } = require('./silentRiskProfiler');

/**
 * Abstraction for Seller Negotiation Eligibility
 * Future-proof wrapper: Currently checks subscription tier.
 * TODO: In future, integrate with AI Risk Score or Admin Override policies.
 * 
 * @param {string} userId 
 * @returns {Promise<boolean>}
 */
async function getSellerNegotiationEligibility(userId) {
    const user = await User.findByPk(userId, { attributes: ['subscriptionTier'] });
    // Plan A or B required
    return user && ['plan_a', 'plan_b'].includes(user.subscriptionTier);
}

/**
 * Filter and Sanitize Product Updates based on Negotiation Policy.
 * Strict Sovereign Control: Decisions regarding Negotiation capabilities happen HERE, not in Controller.
 * 
 * @param {string} userId - The seller's ID
 * @param {object} updates - The raw updates object requesting changes
 * @returns {Promise<object>} - The sanitized updates object allowed for the user
 */
exports.sanitizeNegotiationUpdates = async (userId, updates) => {
    // Check if any restricted fields are present
    const isNegotiationUpdate = (
        updates.autoNegotiationEnabled !== undefined ||
        updates.minAcceptablePrice !== undefined ||
        updates.negotiationStrategy !== undefined ||
        (updates.productTier && ['smart', 'ai_assisted'].includes(updates.productTier))
    );

    if (!isNegotiationUpdate) {
        return updates; // Pass through if no sovereign fields involved
    }

    // Check Eligibility via Abstraction
    const canNegotiate = await getSellerNegotiationEligibility(userId);

    if (canNegotiate) {
        // ALLOW: User is Tier A/B
        return updates;
    } else {
        // DENY: User is not eligible. 
        // Sovereign Action: Silently strip the forbidden fields.
        const sanitized = { ...updates };

        if (sanitized.autoNegotiationEnabled !== undefined) delete sanitized.autoNegotiationEnabled;
        if (sanitized.minAcceptablePrice !== undefined) delete sanitized.minAcceptablePrice;
        if (sanitized.negotiationStrategy !== undefined) delete sanitized.negotiationStrategy;
        // Downgrade tier if attempting higher tier without eligibility
        if (sanitized.productTier && ['smart', 'ai_assisted'].includes(sanitized.productTier)) {
            sanitized.productTier = 'basic';
        }

        // Log the violation attempt strictly internally
        logSilentProfile('NEGOTIATION_ATTEMPT_DENIED', { sellerId: userId });

        return sanitized;
    }
};
