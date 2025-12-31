# ADR 001: Adoption of Hybrid RBAC/ABAC Authorization System

## Status
**Accepted**

## Context
The current authorization system relies on:
1.  **Hardcoded ENUMs** for roles (`buyer`, `seller`, `admin`, `super_admin`) in the database.
2.  **JSON blobs** strings for permissions stored directly on the `User` table.
3.  **Hardcoded logic** in Services/Controllers to check permissions.
4.  **No structural context**, meaning `User` entities are not bound to any geographic or organizational unit (City, Region, Team).

This architecture prevents:
*   Dynamic creation of roles (requires code changes).
*   Granular delegation of authority.
*   Context-aware access control (e.g., A City Manager managing only their city).
*   Scalability to new markets/regions without code refactoring.

## Decision
We will completely replace the current authorization mechanism with a **Hybrid RBAC + ABAC** model.

### 1. Database Schema Changes (RBAC)
We will introduce a relational schema for roles and permissions:
*   `permissions`: Defines atomic capabilities (e.g., `CREATE_USER`).
*   `roles`: Defines groupings of permissions (e.g., `CITY_MANAGER`).
*   `role_permissions`: Junction table.
*   `user_roles`: Assigns roles to users (Many-to-Many).

### 2. Contextual Entities (ABAC Support)
We will reify the concept of "Context" in the database:
*   `regions` -> `cities` -> `teams`.
*   `user_context`: explicitly binds a user to a specific structural scope.

### 3. Middleware Strategy
A unified `authorize` middleware will be implemented:
```javascript
async function authorize(permissionKey) {
   // 1. RBAC Check (Does the user have the capability?)
   // 2. ABAC Check (Does policy allow this action in this context?)
}
```

### 4. Owner Bypass
The `Owner` (defined by System ID `process.env.OWNER_ID`) constitutes a "Root" entity that bypasses all Policy/RBAC checks. This is the **only** bypass mechanism allowed.

### 5. Policy Contract & Resource Loading
To ensure determinism, the `authorize` middleware strictly adheres to the following contract:

**Policy Signature:**
```typescript
allows({
  actor,      // User object (with context)
  resource,   // Loaded domain entity (req.resource)
  action,     // 'view' | 'create' | 'update' | 'delete'
  context     // Derived from actor/resource
}) => boolean
```

**Middleware Requirement:**
Any route protected by a Policy **MUST** pre-load the target entity into `req.resource`. The middleware will throw a 500 error if `req.resource` is missing when a policy check is required.

## Consequences

### Positive
*   **Flexibility:** Admins can create new roles and assign permissions at runtime.
*   **scalability:** New cities/regions can be onboarded by simply creating DB records.
*   **Security:** Centralized policy management reduces the risk of scattered logic errors.
*   **Auditability:** Every permission check is explicit and trackable.

### Negative
*   **Complexity:** The initial implementation is significantly more complex than simple flag checks.
*   **Breaking Change:** Requires a strict data migration strategy for existing users. The `role` column will be deprecated.
*   **Performance:** Requires optimized querying (indexing, potential caching) as permission checks now involve joins.

## Compliance
This decision complies with the "Architectural Directive 1" mandate issued by the System Architect.
