# ADR 003: Shared Kernel
**Date:** 2026-07-18
**Status:** DRAFT (Pending Architecture Review)
**Owner:** Architecture Governance Team

## 1. Context & Problem Statement
Currently, identical concepts like `Money`, `Address`, or `TaxRate` are either duplicated across tables or implemented inconsistently. We need a way to share these structural concepts across Bounded Contexts without creating tight coupling.

## 2. Alternatives Considered
- **Option A (Duplicate Everything):** Each domain implements its own `Money` or `Address`. *Rejected. Leads to conversion errors and bugs.*
- **Option B (Shared Entity Library):** Put `User` and `PurchaseRequest` in a shared library. *Rejected. Breaks bounded context independence (The Big Ball of Mud).*
- **Option C (Shared Kernel - Value Objects Only):** Extract strictly immutable Value Objects, Enums, and Core Interfaces into a Shared Kernel. *Accepted.*

## 3. Decision
- A **Shared Kernel** will be created as an independent module.
- It will ONLY contain **Value Objects** (immutable structures without identity), Enums, and primitive types.
- No Domain Entity (anything with an ID) is allowed in the Shared Kernel.
- Modifying the Shared Kernel requires cross-domain consensus.

## 4. Consequences
- **Positive:** Uniformity in financial calculations and data structures across the enterprise.
- **Negative:** Any change to the Shared Kernel requires recompiling/redeploying all dependent microservices or monolith modules.

## 5. Traceability
- **Business Rule:** "Money is calculated the exact same way everywhere."
- **Implemented By:** Shared Kernel Specification (W1_03).
- **Verified By:** Future Repository Refactoring (Wave 2).
