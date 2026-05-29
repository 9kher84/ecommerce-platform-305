/**
 * QuotePolicy
 * Pure function to determine access to PriceQuote resources.
 * Separates Authorization (Can I Act?) from Visibility (What do I see?).
 */
const QuotePolicy = (user, resource, action) => {
  if (!user) return false;

  if (action === "create") return true;
  if (!resource) return false;

  // Seller ownership actions
  if (["update", "delete", "withdraw", "modify", "respond"].includes(action)) {
    return user.id === resource.sellerId;
  }
  // Seller ownership actions (original)
  // if (['update', 'delete', 'withdraw', 'modify', 'respond'].includes(action)) {
  //     return user.id === resource.sellerId;
  // }

  // Buyer actions (related to Request) (original)
  // if (['accept', 'reject', 'negotiate'].includes(action)) {
  //     return resource.request && resource.request.userId === user.id;
  // }

  // 1. Seller Actions (Modify Resource)
  if (["update", "modify", "respond"].includes(action)) {
    return user.id === resource.sellerId;
  }

  // 2. Lifecycle Actions (Modify State)
  if (["withdraw", "delete", "archive"].includes(action)) {
    // Owner only.
    return user.id === resource.sellerId;
  }

  // 3. Administrative Actions
  if (action === "suspend") {
    // Admin or Context Manager Only (Future).
    // For now, strict Admin check via RBAC usually, but here we enforce Context if needed.
    // If Global Admin (no context) -> Allow.
    // If City Manager -> Allow if in same city (resource.request.cityId).

    // Simulating "Is Admin" via RBAC isn't the policy's job,
    // but Policy enforces "If you ARE Admin (via RBAC), is this resource in your Scope?"

    // Global Admin (implied by no restricted context)
    if (!user.context || !user.context.cityId) return true;

    // Context Manager
    if (resource.request && resource.request.cityId) {
      return user.context.cityId === resource.request.cityId;
    }
    return false;
  }

  // 4. Buyer Actions
  if (["accept", "reject", "negotiate"].includes(action)) {
    // Buyer Only.
    return resource.request && resource.request.userId === user.id;
  }

  // View access
  if (action === "view") {
    // Seller or Buyer
    if (user.id === resource.sellerId) return true;
    if (resource.request && resource.request.userId === user.id) return true;

    // Context scoped users (e.g. City Manager)
    if (user.context && user.context.cityId) {
      const targetCityId = resource.request ? resource.request.cityId : null;
      return targetCityId && user.context.cityId === targetCityId;
    }

    // Global access already passed RBAC
    return true;
  }

  return false;
};

QuotePolicy.version = "v2.3-SOVEREIGN"; // Immutable Version
module.exports = QuotePolicy;
