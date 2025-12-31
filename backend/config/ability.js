const { AbilityBuilder, Ability } = require('@casl/ability');

/**
 * Define CASL Abilities for Users based on Role and Tier.
 * @param {object} user - The user object { id, role, subscriptionTier }
 * @returns {Ability}
 */
function defineAbilitiesFor(user) {
    const { can, cannot, build } = new AbilityBuilder(Ability);

    if (!user) {
        return build();
    }

    if (user.role === 'seller') {
        // Product Management
        can('read', 'Product', { sellerId: user.id });
        can('create', 'Product');
        can('update', 'Product', { sellerId: user.id });
        can('delete', 'Product', { sellerId: user.id });

        // Quote Management
        can('create', 'Quote'); // Logic checks if request allows it
        can('read', 'Quote', { sellerId: user.id });
        can('update', 'Quote', { sellerId: user.id, status: 'pending' }); // Only pending quotes
        can('withdraw', 'Quote', { sellerId: user.id });

        // Tier Specifics
        if (user.subscriptionTier === 'plan_b') {
            can('negotiate_auto', 'Product');
        }
    }

    if (user.role === 'buyer') {
        can('create', 'PurchaseRequest');
        can('read', 'PurchaseRequest', { userId: user.id });
        can('update', 'PurchaseRequest', { userId: user.id, status: 'draft' });

        can('view_quotes', 'PurchaseRequest', { userId: user.id });
        can('accept', 'Quote', { 'request.userId': user.id });
        can('reject', 'Quote', { 'request.userId': user.id });
        can('negotiate', 'Quote', { 'request.userId': user.id });
    }

    if (user.role === 'admin') {
        can('manage', 'all');
    }

    return build();
}

module.exports = { defineAbilitiesFor };
