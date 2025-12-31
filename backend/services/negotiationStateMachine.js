/**
 * Negotiation State Machine
 * Defines valid states and transitions for PriceQuotes.
 */

const STATES = {
    PENDING: 'pending',       // Initial State
    NEGOTIATING: 'negotiating', // Counter loops
    ACCEPTED: 'accepted',     // Final Success
    REJECTED: 'rejected',     // Final Failure
    WITHDRAWN: 'withdrawn',   // Seller Pull
    EXPIRED: 'expired'        // System Timeout
};

const VALID_TRANSITIONS = {
    [STATES.PENDING]: [STATES.NEGOTIATING, STATES.ACCEPTED, STATES.REJECTED, STATES.WITHDRAWN],
    [STATES.NEGOTIATING]: [STATES.NEGOTIATING, STATES.ACCEPTED, STATES.REJECTED, STATES.WITHDRAWN],
    [STATES.REJECTED]: [], // Terminal (Unless Plan B special, handled separately)
    [STATES.ACCEPTED]: [], // Terminal
    [STATES.WITHDRAWN]: [], // Terminal
    [STATES.EXPIRED]: [] // Terminal
};

/**
 * Validates if a transition is allowed.
 * @param {string} currentState 
 * @param {string} nextState 
 * @returns {boolean}
 */
exports.canTransition = (currentState, nextState) => {
    // Plan B "Modify After Rejection" is a special edge case usually handled by creating a NEW quote or resetting state.
    // For Strict State Machine, we check the map.
    const allowed = VALID_TRANSITIONS[currentState] || [];
    return allowed.includes(nextState);
};

exports.STATES = STATES;
